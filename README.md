# express-form-data
Module for parsing multiform data. Based on "connect-multiparty"

# Install 
`npm install express-form-data`

# Example
```js
var formData = require("express-form-data");
var express = require("express");
var app = express();

// parsing data with connect-multiparty. 
app.use(formData.parse(...connectMultipartyOptions));
// clear all empty files (size == 0)
app.use(formData.format());
// change file objects to node stream.Readable 
app.use(formData.stream());
// union body and files
app.use(formData.union());
```

After this functions we can see in req:  
* req.files = {...} all files  
* req.body = {...} all data including files(or streams if you use .stream())
