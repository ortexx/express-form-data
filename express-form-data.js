var multipart = require('connect-multiparty');
var util = require('util');
var fs = require('fs');

var formData = {};

formData.parse = function (options) {
    return multipart(options);
}

formData.json = function () {
    return function (req, res, next) {
		for (var k in req.body) {
			if (typeof req.body[k] == 'string') {
				req.body[k] = JSON.parse(req.body[k]);
			}
		}

        next();
    }
}

formData.union = function () {
    return function (req, res, next) {
        util._extend(req.body, req.stream || req.files);
        next();
    }
}

formData.stream = function (options) {
    return function (req, res, next) {
        if (!req.stream) {
            req.stream = {};
        }

        if (req.hasOwnProperty('files')) {
           try {
                for (var k in req.files) {
                    req.stream[k] = fs.createReadStream(req.files[k].path, options);
                }
           }
           catch (err) {
                return next(err);
           }
        }

        next();
    }
}

module.exports = formData;

