var multipart = require('connect-multiparty');
var util = require('util');
var fs = require('fs');

var formData = {};

function format(obj, fn) {
    for(var k in obj) {
        if(Array.isArray(obj[k])) {
            for(var i = 0; i < obj[k].length; i++) {
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
}

formData.format = function() {
    return function (req, res, next) {
        format(req.files, function(obj) {            
            if(obj.size <= 0) {
                return null;
            }
            else {
                delete obj.fieldName;
            }
            
            return obj;
        });
        
        next();
    }
}

formData.stream = function() {
    return function (req, res, next) {
        format(req.files, function(obj) { 
            return fs.createReadStream(obj.path);
        });
        
        next();
    }
}

formData.union = function () {
    return function (req, res, next) {      
        if(req.files && Array.isArray(req.files)) {
            for(var i = 0; i < req.files.length; i++) {
                if(req.files[i].size <= 0) {
                    continue;
                }
                
                var dy = req.files[i].fieldName.split('[');
                var name = dy[0];
                
                delete req.files[i].fieldName;
                
                if(dy.length > 1) {
                    if(!req.body[name]) {
                        req.body[name] = []; 
                    }
                    
                    req.body[name].push(req.files[i]);
                }
                else {
                    req.body[name] = req.files[i];
                }
            }            
        }
        
        util._extend(req.body, req.files);       
        next();
    }
}

module.exports = formData;

