"use strict";

const should = require('should')();
const express = require('express');
const Monitor = require('../lib/monitor');

let app = null;


describe('Monitor', function () {

  before(function (done) {
    app = express();

    app.get('/must-fail', function(req, res) {
      res.status(500).json({ error: 'Server error' });
    });

    app.get('/must-pass', function(req, res) {
      res.status(200).json({ name: 'tobi' });
    });

    app.listen(3009, function () {
      console.log('Test app listening on port 3009!');
      done();
    });
  });

  describe('#up', function() {
    it('should be ok', function(done) {
      // website has a redirect, should emit down and show status message
      let ping = new Monitor({website: 'http://localhost:3009/must-pass', interval: 0.1});

      ping.on('up', function (res) {
          res.website.should.be.eql('http://localhost:3009/must-pass');
          res.statusCode.should.be.eql(200);
          ping.stop();
          done();
      });

      ping.on('down', function (res) {
          ping.stop();
          done(res);
      });
    });
  });

  describe('#down', function() {
    it('should be not be down', function(done) {
      // website has a redirect, should emit down and show status message
      let ping2 = new Monitor({website: 'http://localhost:3009/must-fail', interval: 0.1});

      ping2.on('up', function (res) {
        res.website.should.be.eql('http://localhost:3009/must-fail');
        res.statusCode.should.be.eql(500);

        ping2.stop();
        done(res);
      });

      ping2.on('down', function (res) {
        res.website.should.be.eql('http://localhost:3009/must-fail');
        ping2.stop();
        done();
      });
    });
  });


  after(function (done) {
    done();
    process.exit();
  });
});
