"use strict";

const expect = require('chai').expect;
const nock = require('nock');
const Monitor = require('../lib/monitor');
let tcpServer = null;


describe('Monitor', () => {
  before(() => {
    nock('https://ragingflame.co.za')
      .get('/must-pass')
      .reply(200, "page is up");

    nock('https://ragingflame.co.za')
      .get('/must-fail')
      .reply(500, "page is up");

    tcpServer = require('./tcpServer')
  });

  it('should pass', (done) => {

    let ping = new Monitor({
      website: 'https://ragingflame.co.za/must-pass',
      interval: 0.1
    });

    ping.on('up', function (res, state) {
      expect(res.statusCode).to.equal(200);
      expect(state.totalRequests).to.equal(1);

      ping.stop();

      done();
    });

    ping.on('down', function (res, state) {
      expect(res.statusCode).to.equal(200);
      expect(state.totalRequests).to.equal(1);
      ping.stop();
      done(new Error(res.statusMessage));
    });
  });

  it('should fail', (done) => {

    let ping = new Monitor({
      website: 'https://ragingflame.co.za/must-fail',
      interval: 0.1
    });

    ping.on('up', function (res, state) {
      expect(res.statusCode).to.equal(500);
      ping.stop();
      done(new Error(res.statusMessage));
    });

    ping.on('down', function (res, state) {
      expect(res.statusCode).to.equal(500);
      expect(state.totalRequests).to.equal(1);
      ping.stop();
      done();
    });
  });

  it('should handle the stop event', (done) => {

    let ping = new Monitor({
      website: 'https://ragingflame.co.za/must-pass',
      interval: 0.1
    });

    ping.on('stop', function (res, state) {
      expect(res).to.equal('https://ragingflame.co.za/must-pass');
      expect(state.host).to.equal('https://ragingflame.co.za/must-pass');
      done();
    });

    ping.stop();
  });

  it('should connect to tcp', (done) => {

    let ping = new Monitor({
      address: '127.0.0.1',
      port: 8124,
      interval: 0.1
    });

    ping.on('up', function (res, state) {
      expect(res.statusCode).to.equal(200);
      expect(state.totalRequests).to.equal(1);
      ping.stop();
      done();
    });

    ping.on('down', function (res, state) {
      expect(res.statusCode).to.equal(200);
      ping.stop();
      done(new Error(res.statusMessage));
    });
  });

  after(function (done) {
    tcpServer.close();
    done();
    process.exit();
  });
});
