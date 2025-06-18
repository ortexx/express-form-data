const createError = require('http-errors')
const multiparty = require('multiparty');
const onFinished = require('on-finished');
const qs = require('qs');
const typeis = require('type-is');

function multipart (options) {
  options = options || {};

  return function multipart(req, res, next) {
    if (req._body) return next();
    req.body = req.body || {};
    req.files = req.files || {};
    if ('GET' === req.method || 'HEAD' === req.method) return next();
    if (!typeis(req, 'multipart/form-data')) return next();
    req._body = true;
    let form = new multiparty.Form(options);
    let data = {};
    let files = {};
    let done = false;

    function ondata(name, val, data){
      if (Array.isArray(data[name])) {
        data[name].push(val);
      } 
      else if (data[name]) {
        data[name] = [data[name], val];
      } 
      else {
        data[name] = val;
      }
    }

    form.on('field', function(name, val){
      ondata(name, val, data);
    });

    form.on('file', function(name, val){
      val.name = val.originalFilename;
      val.type = val.headers['content-type'] || null;
      ondata(name, val, files);
    });

    form.on('error', function(err){
      if (done) return;

      done = true;
      let error = createError(400, err);
      if (!req.readable) return next(error);
      req.resume();
      onFinished(req, () => next(error));
    });

    form.on('close', function() {
      if (done) return;
      done = true;
      req.body = qs.parse(data, { allowDots: true });
      req.files = qs.parse(files, { allowDots: true });
      next();
    });

    form.parse(req);
  }
};

module.exports = multipart