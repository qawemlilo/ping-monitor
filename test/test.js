/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
'use strict';

const expect = require('chai').expect;
const nock = require('nock');
const Monitor = require('../lib/monitor');
const Utils = require('../lib/utils');
const Channel = require('./channel');
let tcpServer = null;
let udpServer = null;


describe('Monitor', function () {
  before(function () {
    nock('https://test.com')
      .get('/must-pass')
      .reply(200, 'page is up');

    nock('https://test.com')
      .get('/must-pass-1')
      .reply(200, 'page is up');

    nock('https://test.com')
      .get('/must-pass-2')
      .reply(200, 'page is up');

    nock('https://test.com')
      .get('/must-pass-3')
      .reply(200, 'page is up');

    nock('https://test.com')
      .get('/must-pass-14')
      .reply(200, 'page is up');

    nock('https://test.com')
      .get('/must-pass-4')
      .reply(200, 'page is up');

    nock('https://test.com')
      .persist()
      .get('/test-redirect')
      .reply(301, undefined, {
        'Location': 'http://redirecter.com/must-pass-2'
      });


    nock('https://test.com')
      .get('/not-active')
      .reply(200, 'page is up');

    nock('https://test.com')
      .get('/must-fail')
      .reply(404, 'page is down');

    nock('https://test.com')
      .get('/test-http-options/users')
      .reply(301, 'page is up');

    nock('https://test.com')
      .post('/users')
      .reply(200, (uri, requestBody) => requestBody);

    nock('https://test.com')
      .get('/timeout')
      .delay(5000)
      .reply(200, 'Page is up');

    nock('https://test.com')
      .get('/content-search')
      .reply(200, 'The quick brown fox jumps over the lazy dog');

    nock('https://test.com')
      .get('/content-search-2')
      .reply(200, 'The quick brown fox jumps over the lazy dog');

    nock('https://test.com')
      .get('/test-threshhold-retry')
      .reply(404, 'page is down');


    nock('https://test.com')
      .get('/test-threshhold-reached')
      .reply(404, 'page is down');


    nock('https://test.com')
      .get('/test-response-time')
      .delay(300)
      .reply(200, 'Page is up');

    tcpServer = require('./tcpServer');

    udpServer = require('./udpServer');
  });

  it('#1 should pass', function (done) {

    let ping = new Monitor({
      website: 'https://test.com/must-pass',
      interval: 1,
      config: {
        intervalUnits: 'seconds',
        generateId: true
      }
    });

    ping.on('up', function (res, state) {
      expect(res.statusCode).to.equal(200);
      expect(res.address).to.equal('https://test.com/must-pass');
      expect(res.port).to.be.a('null');
      expect(res.time).to.gt(0);
      expect(res.responseTime).to.gt(0);
      expect(res.responseMessage).to.be.a('string');
      expect(res.httpResponse).to.be.an('object');

      // check state props
      expect(state.id).to.be.a('string');
      expect(state.created_at).to.be.gt(0);
      expect(state.isUp).to.be.true;
      expect(state.address).to.equal('https://test.com/must-pass');
      expect(state.port).to.be.a('null');
      expect(state.interval).to.equal(1);
      expect(state.totalRequests).to.equal(1);
      expect(state.totalDownTimes).to.equal(0);
      expect(state.lastRequest).to.be.gt(0);
      expect(state.lastDownTime).to.be.a('null');
      expect(state.title).to.be.a('string');

      ping.stop();

      done();
    });

    ping.on('down', function (res, state) {
      ping.stop();
      done(new Error(res.responseMessage));
    });
  });


  it('#1.1 should have null id', function (done) {

    let ping = new Monitor({
      website: 'https://test.com/must-pass-4',
      interval: 1,
      config: {
        intervalUnits: 'seconds',
        generateId: false
      }
    });

    ping.on('up', function (res, state) {
      expect(res.statusCode).to.equal(200);

      // check state props
      expect(state.id).to.be.a('null');
      expect(state.created_at).to.be.gt(0);
      expect(state.isUp).to.be.true;
      expect(state.address).to.equal('https://test.com/must-pass-4');
      expect(state.port).to.be.a('null');
      expect(state.interval).to.equal(1);
      expect(state.totalRequests).to.equal(1);
      expect(state.totalDownTimes).to.equal(0);
      expect(state.lastRequest).to.be.gt(0);
      expect(state.lastDownTime).to.be.a('null');
      expect(state.title).to.be.a('string');

      ping.stop();

      done();
    });

    ping.on('down', function (res, state) {
      ping.stop();
      done(new Error(res.responseMessage));
    });
  });


  it('#2 should pass', function (done) {

    let ping = new Monitor({
      website: 'https://test.com/must-pass-1',
      interval: 300,
      config: {
        intervalUnits: 'milliseconds'
      }
    });

    ping.on('up', function (res, state) {
      expect(res.statusCode).to.equal(200);

      // check state props
      expect(state.id).to.be.a('string');
      expect(state.created_at).to.be.gt(0);
      expect(state.isUp).to.be.true;
      expect(state.address).to.equal('https://test.com/must-pass-1');
      expect(state.port).to.be.a('null');
      expect(state.interval).to.equal(300);
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
      done(new Error(res.responseMessage));
    });
  });


  it('#3 state should override monitor options', function (done) {

    let pinger = new Monitor({
      address: 'https://test.com/must-fail',
      interval: 0.2
    }, {
      address: 'https://test.com/must-pass-2',
      interval: 0.1
    });

    pinger.on('up', function (res, state) {
      expect(res.statusCode).to.equal(200);

      // check state props
      expect(state.id).to.be.a('string');
      expect(state.created_at).to.be.gt(0);
      expect(state.isUp).to.be.true;
      expect(state.address).to.equal('https://test.com/must-pass-2');
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
      pinger.stop();
      done(new Error(res.responseMessage));
    });

    pinger.on('error', function (error) {
      done(error);
    });
  });

  it('#4 should fail', function (done) {

    let ping = new Monitor({
      address: 'https://test.com/must-fail',
      interval: 0.1
    });

    ping.on('down', function (res) {
      ping.stop();
      done();
    });
  });

  it('#5 should handle the stop event', function (done) {

    let ping = new Monitor({
      address: 'https://test.com/must-pass-3',
      interval: 0.1
    });

    ping.on('stop', function (res, state) {
      expect(res.statusCode).to.equal(200);
      done();
    });

    ping.stop();
  });

  it('#6 should connect to tcp', function (done) {

    let ping = new Monitor({
      address: '127.0.0.1',
      port: 8124,
      interval: 0.1,
      protocol: 'tcp'
    });

    ping.on('up', function (res, state) {
      expect(res.statusCode).to.equal(200);
      expect(state.totalRequests).to.equal(1);
      ping.stop();
      done();
    });

    ping.on('down', function (res, state) {
      ping.stop();
      done(new Error(res.responseMessage));
    });
  });


  it('#7 should test redirect', function (done) {
    try {
      let pingRedirect = new Monitor({
        address: 'https://test.com/test-redirect',
        interval: 0.1,
        expect: {
          statusCode: 301
        }
      });

      pingRedirect.on('up', function (res, state) {
        expect(res.statusCode).to.equal(301);
        expect(state.id).to.be.a('string');
        expect(state.created_at).to.be.gt(0);
        expect(state.isUp).to.be.true;
        expect(state.address).to.equal('https://test.com/test-redirect');
        expect(state.port).to.be.a('null');
        expect(state.interval).to.equal(0.1);
        expect(state.totalRequests).to.equal(1);
        expect(state.totalDownTimes).to.equal(0);
        expect(state.lastRequest).to.be.gt(0);
        expect(state.lastDownTime).to.be.a('null');
        expect(state.title).to.be.a('string');

        pingRedirect.stop();
        done();
      });

      pingRedirect.on('down', function (res, state) {
        pingRedirect.stop();
        done(new Error(res.responseMessage));
      });
    }
    catch(e) {
      done();
    }
  });


  it('#8 should test httpOptions', function (done) {
    try {
      let pingHttp = new Monitor({
        address: 'https://test.com/test-http-options/users',
        interval: 100,
        intervalUnit: 'milliseconds',
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
        pingHttp.stop();
        done(new Error(res.responseMessage));
      });

      pingHttp.on('error', function (error) {
        done(error);
      });
    }
    catch(e) {
      done();
    }
  });

  it('#9 should post body', function (done) {
    try {
      let pingHttp = new Monitor({
        address: 'https://test.com/users',
        interval: 0.1,
        httpOptions: {
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
        console.log(res);
        pingHttp.stop();
        done(new Error(res.responseMessage));
      });

      pingHttp.on('error', function (error) {
        console.log(error);
        done(error);
      });
    }
    catch(e) {
      done();
    }
  });

  it('#10 should timeout request', function (done) {
    try {
      let pingHttp = new Monitor({
        address: 'https://test.com/timeout',
        interval:1,
        config: {
          intervalUnits: 'seconds'
        },
        httpOptions: {
          timeout: 100
        }
      });

      pingHttp.on('up', function (res) {
        pingHttp.stop();
        done(new Error('up - should timeout request'));
      });

      pingHttp.on('down', function (res) {
        pingHttp.stop();
        done(new Error('down - should timeout request'));
      });

      pingHttp.on('timeout', function (error, res) {
        expect(res.statusCode).to.equal(408);
        pingHttp.stop();
        done();
      });

      pingHttp.on('error', function (error, res) {
        pingHttp.stop();
        done(new Error('down - should timeout request'));
      });
    }
    catch(e) {
      done();
    }
  });

  it('#11 should pass content search', function (done) {

    let ping = new Monitor({
      address: 'https://test.com/content-search',
      interval: 0.1,
      expect: {
        contentSearch: 'fox'
      }
    });

    ping.on('up', function (res, state) {
      expect(res.statusCode).to.equal(200);
      ping.stop();
      done();
    });
  });

  it('#12 should fail content search', function (done) {

    let ping = new Monitor({
      address: 'https://test.com/content-search-2',
      interval: 0.1,
      expect: {
        contentSearch: '123'
      }
    });

    ping.on('up', function (res, state) {
      expect(res.statusCode).to.equal(500);

      // check state props
      expect(state.id).to.be.a('string');
      expect(state.created_at).to.be.gt(0);
      expect(state.isUp).to.be.false;
      expect(state.address).to.equal('https://test.com/content-search-2');
      expect(state.port).to.be.a('null');
      expect(state.interval).to.equal(0.1);
      expect(state.totalRequests).to.equal(1);
      expect(state.totalDownTimes).to.equal(0);
      expect(state.lastRequest).to.be.gt(0);
      expect(state.lastDownTime).to.be.a('null');
      expect(state.title).to.be.a('string');

      ping.stop();

      done(new Error('Should have never got here'));
    });

    ping.on('down', function (res, state) {
      expect(res.statusCode).to.equal(200);
      expect(state.totalRequests).to.equal(1);
      ping.stop();
      done();
    });
  });

  it('#13 should load broken ssl', function (done) {
    try {
      let pingHttp = new Monitor({
        address: 'https://wrong.host.badssl.com',
        interval: 300,
        ignoreSSL: true,
        config: {
          intervalUnits: 'milliseconds'
        },
        expect: {
          statusCode: 200
        }
      });

      pingHttp.on('up', function (res) {
        pingHttp.stop();
        done();
      });

      pingHttp.on('down', function (res) {
        pingHttp.stop();
        done(new Error('down - should load request'));
      });

      pingHttp.on('timeout', function (error, res) {
        pingHttp.stop();
        done(new Error('down - should load request'));
      });

      pingHttp.on('error', function (error, res) {
        pingHttp.stop();
        done(new Error('down - should load request'));
      });
    }
    catch(e) {
      done();
    }
  });

  it('#14 should add notification channel', function (done) {
    try {
      let ping = new Monitor({
        address: 'https://test.com/must-pass-14',
        interval: 1,
        config: {
          intervalUnits: 'seconds',
        }
      });
      let channel = new Channel({});

      expect(ping.addChannel).to.be.a('function');
      expect(ping.addNotificationChannel).to.be.a('function');

      ping.addChannel(channel);

      expect(ping.channels.length).to.be.eq(1);
      expect(ping.channels[0]).to.be.instanceof(Channel);

      ping.stop();
      done();
    }
    catch(e) {
      done();
    }
  });

  it('#14 should connect to udp', function (done) {

    let ping = new Monitor({
      address: '127.0.0.1',
      port: 1234,
      interval: 0.1,
      protocol: 'udp'
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
      done(new Error(res.responseMessage));
    });
  });

  it('#15 should convert website to address', function (done) {

    let ping = new Monitor({
      website: 'https://test.com/login',
      port: 1234,
      interval: 0.1
    });

    let opts = {
      id: 1,
      website: 'https://random.com'
    };

    let normalisedOpts = ping.normaliseAddress(opts);

    expect(normalisedOpts.address).to.equal('https://random.com');
    expect(normalisedOpts).to.not.have.property('website');

    ping.stop();
    done();
  });


  it('#16 should test threshold retry', function (done) {

    let ping = new Monitor({
      address: 'https://test.com/test-threshhold-retry',
      interval: 0.1,
      threshold: 2
    });

    ping.on('retry', function (res, state) {
      expect(state.retries).to.equal(1);
      ping.stop();
      done();
    });
  });


  it('#17 should test threshold', function (done) {

    let ping = new Monitor({
      address: 'https://test.com/test-threshhold-reached',
      interval: 0.1,
      threshold: 2
    }, {
      retries: 1,
    });

    expect(ping.retries).to.equal(1);

    ping.on('down', function (res, state) {
      expect(state.retries).to.equal(0);
      ping.stop();
      done();
    });
  });

  after(function (done) {
    tcpServer.close();
    udpServer.close();
    done();
  });
});


describe('Utils', function() {
  describe('#intervalUnits()', function() {
    it('should convert intervalUnits', function() {
      const interval = 1;

      expect(Utils.intervalUnits(interval, 'milliseconds')).to.equal(1);
      expect(Utils.intervalUnits(interval, 'seconds')).to.equal(1000);
      expect(Utils.intervalUnits(interval, 'minutes')).to.equal(60000);
      expect(Utils.intervalUnits(interval, 'hours')).to.equal(3600000);
    });
  });


  describe('#getFormatedDate()', function() {
    it('should convert intervalUnits', function() {
      const CurrentYear = new Date().getFullYear();
      expect(Utils.getFormatedDate()).to.include(CurrentYear);
    });
  });

  after(function (done) {
    done();
    process.exit();
  });
});

