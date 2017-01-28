"use strict";

let multipart = require('connect-multiparty');
let fs = require('fs');

let formData = {};

function format(obj, fn) {
  for(let k in obj) {
    if(Array.isArray(obj[k])) {
      for(let i = 0; i < obj[k].length; i++) {
        obj[k][i] = fn(obj[k][i]);

        if(!obj[k][i]) {
          obj[k].splice(i, 1);
        }
      }

      if(!obj[k].length) {
        delete obj[k];
      }
    }
    else if(typeof obj[k] == 'object' && !obj[k].hasOwnProperty('originalFilename')) {
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
  return multipart(options);
};

formData.format = function() {
  return function (req, res, next) {
    format(req.files, function(obj) {
      if(obj.size <= 0) {
        return null;
      }

      return obj;
    });

    next();
  }
};

formData.stream = function() {
  return function (req, res, next) {
    format(req.files, function(obj) {
      return fs.createReadStream(obj.path);
    });

    next();
  }
};

formData.union = function () {
  return function (req, res, next) {
    Object.assign(req.body, req.files);
    next();
  }
};

module.exports = formData;
