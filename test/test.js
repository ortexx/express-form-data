"use strict";

const assert = require('chai').assert;
const connect = require('connect');
const path = require('path');
const fs = require('fs-extra');
const request = require('supertest');
const stream = require('stream');
const formData = require('../express-form-data');

describe('ExpressFormData:', function () {
  before(function() {
    fs.ensureDirSync(path.join(__dirname, 'tmp'));
  });

  after(function() {
    fs.removeSync(path.join(__dirname, 'tmp'));
  });

  let userName = 'Alex';
  let userEmail = 'first@example.com';

  function createApp() {
    let app = connect();

    app.use(formData.parse({
      uploadDir: path.join(__dirname, 'tmp')
    }));

    return app;
  }

  function createRequest(app, callback) {
    app.use(function(req, res){
      res.end(req.files.info.originalFilename);
    });

    request(app)
      .post('/')
      .field('user[name]', userName)
      .field('user[email]', userEmail)
      .attach('info', new Buffer('file text'), 'info.txt')
      .attach('zero', new Buffer(''), 'zero.txt')
      .expect(200)
      .end(callback)
  }

  it('.parse', function (done) {
    let app = createApp();

    app.use(function(req, res){
      assert.equal(req.body.user.name, userName);
      assert.equal(req.body.user.email, userEmail);
      assert.equal(req.files.info.originalFilename, 'info.txt');
      assert.equal(req.files.zero.originalFilename, 'zero.txt');
      assert.isOk(req.files.info.size > 0);
      res.end();
    });

    createRequest(app, done);
  });

  it('.format', function (done) {
    let app = createApp();

    app.use(formData.format());

    app.use(function(req, res){
      assert.isUndefined(req.files.zero);
      res.end();
    });

    createRequest(app, done);
  });

  it('.stream', function (done) {
    let app = createApp();

    app.use(formData.stream());

    app.use(function(req, res){
      assert.instanceOf(req.files.info, stream.Readable);
      res.end();
    });

    createRequest(app, done);
  });

  it('.union', function (done) {
    let app = createApp();

    app.use(formData.stream());
    app.use(formData.union());

    app.use(function(req, res){
      assert.equal(req.body.user.name, userName);
      assert.equal(req.body.user.email, userEmail);
      assert.instanceOf(req.body.info, stream.Readable);
      res.end();
    });

    createRequest(app, done);
  });
});

