"use strict";

const multipart = require('connect-multiparty');
const fse = require('fs-extra');
const fs = require('fs');
const onExit = require('signal-exit');
const formData = {};

function autoClean(files, onExitRemover) {
  const clean = [];

  format(files, (file) => {
    file instanceof fs.ReadStream && file.destroy && file.destroy();

    if(typeof file != 'object' || typeof file.path != 'string') {
      return null;
    }
    
    clean.push(new Promise((resolve, reject) => {
      fse.remove(file.path).then(resolve).catch(err => {
        err.code == 'ENOENT'? resolve(): reject(err);
      });
    }));

    return file;
  });
  
  Promise.all(clean)
    .finally(() => onExitRemover && onExitRemover())
    .catch(err => console.warn(err.stack));
}

function cleanSync(files) {      
  format(files, (file) => {
    file instanceof fs.ReadStream && file.destroy && file.destroy();
    
    if(typeof file != 'object' || typeof file.path != 'string') {
      return;
    }
    
    try {
      fse.removeSync(file.path);
    }
    catch(err) {
      console.warn(err.stack);
    }    
  });
}

function format (obj, fn) {
  for(let k in obj) {
    if(Array.isArray(obj[k])) {
      for(let i = 0, l = obj[k].length; i < l; i++) {
        obj[k][i] = fn(obj[k][i]);

        if(!obj[k][i]) {
          obj[k].splice(i, 1);
        }
      }

      if(!obj[k].length) {
        delete obj[k];
      }
    }
    else if(
      obj[k] &&
      typeof obj[k] == 'object' && 
      !obj[k].hasOwnProperty('originalFilename') &&
      !(obj[k] instanceof fs.ReadStream)
    ) {
      format(obj[k], fn);

      if(!Object.keys(obj[k]).length) {       
        delete obj[k];
      }
    }
    else {
      obj[k] = fn(obj[k]);

      if(!obj[k]) {
        delete obj[k];
      }
    }
  }
}

formData.parse = function (options) {
  return function (req, res) {
    if(options && options.autoClean) {
      const onExitRemover = onExit(() => cleanSync(req.files));
      req.on('close', () => autoClean(req.files, onExitRemover));
      res.on('finish', () => autoClean(req.files, onExitRemover));
    }    

    return multipart(options).apply(this, arguments);
  }
};

formData.format = function () {
  return function (req, res, next) {
    const clean = [];

    format(req.files, obj => {
      if(obj.size <= 0) {
        clean.push(fse.remove(obj.path));
        return null;
      }

      return obj;
    });

    Promise.all(clean).then(() => next()).catch(next);
  };
};

formData.stream = function () {
  return function (req, res, next) {
    format(req.files, obj => fs.createReadStream(obj.path));
    next();
  };
};

formData.union = function () {
  return function (req, res, next) {
    Object.assign(req.body, req.files);
    next();
  };
};

module.exports = formData;
