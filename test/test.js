"use strict";

const assert = require('chai').assert;
const connect = require('connect');
const path = require('path');
const fs = require('fs-extra');
const request = require('supertest');
const stream = require('stream');
const formData = require('../index');

describe('ExpressFormData:', function () {
  const tempDir = path.join(__dirname, 'tmp');

  before(() => {
    fs.ensureDirSync(tempDir);
  });

  after(() => {
    fs.removeSync(tempDir);
  });

  let userName = 'Alex';
  let userEmail = 'first@example.com';

  function createApp() {
    let app = connect();

    app.use(formData.parse({
      uploadDir: path.join(__dirname, 'tmp'),
      autoClean: true
    }));

    return app;
  }

  function createRequest(app, callback) {
    app.use((req, res) => {
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

  it('should parse', function (done) {
    let app = createApp();

    app.use((req, res) => {
      assert.equal(req.body.user.name, userName);
      assert.equal(req.body.user.email, userEmail);
      assert.equal(req.files.info.originalFilename, 'info.txt');
      assert.isTrue(fs.existsSync(req.files.info.path));
      assert.equal(req.files.zero.originalFilename, 'zero.txt');
      assert.isOk(req.files.info.size > 0);
      res.end();
    });

    createRequest(app, done);
  });

  it('should format', function (done) {
    let app = createApp();
    app.use(formData.format());

    app.use((req, res) => {
      assert.isUndefined(req.files.zero);
      assert.lengthOf(fs.readdirSync(tempDir), 1);
      res.end();
    });

    createRequest(app, done);
  });

  it('should make stream files', function (done) {
    let app = createApp();
    app.use(formData.stream());

    app.use((req, res) => {
      assert.instanceOf(req.files.info, stream.Readable);
      res.end();
    });

    createRequest(app, done);
  });

  it('should union', (done) => {
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

  it('should clean all', done => {
    setTimeout(() => {
      assert.lengthOf(fs.readdirSync(tempDir), 0);
      done();
    });    
  });
});

