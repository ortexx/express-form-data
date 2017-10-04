# express-form-data
Module to parse multiform data. Based on [connect-multiparty](https://github.com/expressjs/connect-multiparty)

# Install 
`npm install express-form-data`

# Example
```js
const formData = require("express-form-data");
const express = require("express");
const app = express();

const multipartyOptions = {
  autoFiles: true;
};

// parse a data with connect-multiparty. 
app.use(formData.parse(multipartyOptions));
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
