# express-form-data
Module for parsing multiform data. Base on "connect-multiparty"
# Install 
`npm install express-form-data`
# Example
```js
var formData = require("express-form-data");
var express = require("express");
var app = express();

// parsing data with connect-multiparty. Result set on req.body and req.files
app.use(formData.parse(...connectMultipartyOptions));
// change all request body to json format
app.use(formData.json());
// create node stream.Readable from elements in req.files and add them in req.stream
app.use(formData.stream());
// add all information to req.data
app.use(formData.data());
```

After this functions we can see in req:
* req.files = {...} all files request data in connect-multiparty object format
* req.stream = {...} all files request data in node stream object format
* req.body = {...} all request data including files(or streams if you use .stream())
