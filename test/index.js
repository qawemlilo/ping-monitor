'use strict';

const expect = require('chai').expect;
const nock = require('nock');
const Monitor = require('../lib/monitor');
let tcpServer = null;


describe('Monitor', function () {
  before(function () {
    nock('https://ragingflame.co.za')
      .get('/must-pass')
      .reply(200, 'page is up');

    nock('https://ragingflame.co.za')
      .get('/must-pass-2')
      .reply(200, 'page is up');

    nock('https://ragingflame.co.za')
      .get('/must-pass-3')
      .reply(200, 'page is up');


    nock('https://ragingflame.co.za')
      .get('/test-redirect')
      .reply(301, 'page has be redirected up');

    nock('https://ragingflame.co.za')
      .get('/not-active')
      .reply(200, 'page is up');

    nock('https://ragingflame.co.za')
      .get('/must-fail')
      .reply(500, 'page is up');

    nock('https://ragingflame.co.za')
        .get('/test-http-options/users')
        .reply(301, 'page is up');

    nock('https://ragingflame.co.za')
        .post('/users')
        .reply(200, (uri, requestBody) => requestBody)

    tcpServer = require('./tcpServer')
  });

  it('should pass', function (done) {

    let ping = new Monitor({
      website: 'https://ragingflame.co.za/must-pass',
      interval: 0.1
    });

    ping.on('up', function (res, state) {
      expect(res.statusCode).to.equal(200);

      // check state props
      expect(state.id).to.be.a('null');
      expect(state.created_at).to.be.gt(0);
      expect(state.active).to.be.true;
      expect(state.isUp).to.be.true;
      expect(state.host).to.be.equal('https://ragingflame.co.za/must-pass');
      expect(state.website).to.equal('https://ragingflame.co.za/must-pass');
      expect(state.address).to.be.a('null');
      expect(state.port).to.be.a('null');
      expect(state.interval).to.equal(0.1);
      expect(state.totalRequests).to.equal(1);
      expect(state.totalDownTimes).to.equal(0);
      expect(state.lastRequest).to.be.gt(0);
      expect(state.lastDownTime).to.be.a('null');
      expect(state.title).to.be.a('string');

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


  it('should throw error', function (done) {
    try {
      let pingdom = new Monitor({
        website: 'https://ragingflame.co.za/must-pass',
        address: '127.0.0.1'
      });

      pingdom.on('error', function (error) {
        expect(error).to.be.an.instance.of(error);
        done();
      });
    }
    catch(e) {
      done();
    }
  });

  it('state should override monitor options', function (done) {

    let pinger = new Monitor({
      website: 'https://ragingflame.co.za/must-fail',
      interval: 0.2
    }, {
      website: 'https://ragingflame.co.za/must-pass-2',
      interval: 0.1
    });

    pinger.on('up', function (res, state) {
      expect(res.statusCode).to.equal(200);

      // check state props
      expect(state.id).to.be.a('null');
      expect(state.created_at).to.be.gt(0);
      expect(state.active).to.be.true;
      expect(state.isUp).to.be.true;
      expect(state.host).to.be.equal('https://ragingflame.co.za/must-pass-2');
      expect(state.website).to.equal('https://ragingflame.co.za/must-pass-2');
      expect(state.address).to.be.a('null');
      expect(state.port).to.be.a('null');
      expect(state.interval).to.equal(0.1);
      expect(state.totalRequests).to.equal(1);
      expect(state.totalDownTimes).to.equal(0);
      expect(state.lastRequest).to.be.gt(0);
      expect(state.lastDownTime).to.be.a('null');
      expect(state.title).to.be.a('string');

      pinger.stop();

      done();
    });

    pinger.on('down', function (res, state) {

      expect(res.statusCode).to.equal(200);
      expect(state.totalRequests).to.equal(1);
      pinger.stop();
      done(new Error(res.statusMessage));
    });

    pinger.on('error', function (error) {
      done(error);
    });
  });

  it('should fail', function (done) {

    let ping = new Monitor({
      website: 'https://ragingflame.co.za/must-fail',
      interval: 0.1
    });

    ping.on('up', function (res) {
      expect(res.statusCode).to.equal(500);
      ping.stop();
      done(new Error(res.statusMessage));
    });

    ping.on('down', function (res, state) {
      expect(res.statusCode).to.equal(500);

      // check state props
      expect(state.id).to.be.a('null');
      expect(state.created_at).to.be.gt(0);
      expect(state.active).to.be.true;
      expect(state.isUp).to.be.false;
      expect(state.host).to.be.equal('https://ragingflame.co.za/must-fail');
      expect(state.website).to.equal('https://ragingflame.co.za/must-fail');
      expect(state.address).to.be.a('null');
      expect(state.interval).to.equal(0.1);
      expect(state.totalRequests).to.equal(1);
      expect(state.totalDownTimes).to.equal(1);
      expect(state.lastRequest).to.be.gt(0);
      expect(state.lastDownTime).to.be.gt(0);
      expect(state.title).to.be.a('string');

      ping.stop();
      done();
    });
  });

  it('should handle the stop event', function (done) {

    let ping = new Monitor({
      website: 'https://ragingflame.co.za/must-pass-3',
      interval: 0.1
    });

    ping.on('stop', function (res, state) {
      expect(res.statusCode).to.equal(200);
      done();
    });

    ping.stop();
  });

  it('should connect to tcp', function (done) {

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


  it('should test redirect', function (done) {
    try {
      let pingRedirect = new Monitor({
        website: 'https://ragingflame.co.za/test-redirect',
        interval: 0.1,
        expect: {
          statusCode: 301
        }
      });

      ping.on('up', function (res, state) {
        expect(res.statusCode).to.equal(301);
        expect(state.id).to.be.a('null');
        expect(state.created_at).to.be.gt(0);
        expect(state.active).to.be.true;
        expect(state.isUp).to.be.true;
        expect(state.host).to.be.equal('https://ragingflame.co.za/test-redirect');
        expect(state.website).to.equal('https://ragingflame.co.za/test-redirect');
        expect(state.address).to.be.a('null');
        expect(state.port).to.be.a('null');
        expect(state.interval).to.equal(0.1);
        expect(state.totalRequests).to.equal(1);
        expect(state.totalDownTimes).to.equal(0);
        expect(state.lastRequest).to.be.gt(0);
        expect(state.lastDownTime).to.be.a('null');
        expect(state.title).to.be.a('string');

        ping.stop();
        done();
      });

      ping.on('down', function (res, state) {
        expect(res.statusCode).to.equal(301);
        ping.stop();
        done(new Error(res.statusMessage));
      });
    }
    catch(e) {
      done();
    }
  });


  it('should test httpOptions', function (done) {
    try {
      let pingHttp = new Monitor({
        website: 'https://ragingflame.co.za/test-http-options',
        interval: 0.1,
        httpOptions: {
          path: '/test-http-options/users'
        },
        expect: {
          statusCode: 301
        }
      });

      pingHttp.on('up', function (res, state) {
        expect(res.statusCode).to.equal(301);
        pingHttp.stop();
        done();
      });

      pingHttp.on('down', function (res, state) {
        expect(res.statusCode).to.equal(301);
        pingHttp.stop();
        done(new Error(res.statusMessage));
      });

      pingHttp.on('error', function (error) {
        done(error);
      });
    }
    catch(e) {
      done();
    }
  });

  it('should post body', function (done) {
    try {
      let pingHttp = new Monitor({
        website: 'https://ragingflame.co.za',
        interval: 0.1,
        httpOptions: {
          path: '/users',
          method: 'post',
          body: 'Test'
        },
        expect: {
          statusCode: 200
        }
      });

      pingHttp.on('up', function (res) {
        expect(res.statusCode).to.equal(200);
        pingHttp.stop();
        done();
      });

      pingHttp.on('down', function (res) {
        expect(res.statusCode).to.equal(200);
        pingHttp.stop();
        done(new Error(res.statusMessage));
      });

      pingHttp.on('error', function (error) {
        done(error);
      });
    }
    catch(e) {
      done();
    }
  });

  after(function (done) {
    tcpServer.close();
    done();
    process.exit();
  });
});
