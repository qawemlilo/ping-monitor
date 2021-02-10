/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
'use strict';

const expect = require('chai').expect;
const nock = require('nock');
const Monitor = require('../lib/monitor');
const Utils = require('../lib/utils');
let tcpServer = null;


describe('Monitor', function () {
  before(function () {
    nock('https://ragingflame.co.za')
      .get('/must-pass')
      .reply(200, 'page is up');

    nock('https://ragingflame.co.za')
      .get('/must-pass-1')
      .reply(200, 'page is up');

    nock('https://ragingflame.co.za')
      .get('/must-pass-2')
      .reply(200, 'page is up');

    nock('https://ragingflame.co.za')
      .get('/must-pass-3')
      .reply(200, 'page is up');

    nock('https://ragingflame.co.za')
      .get('/must-pass-4')
      .reply(200, 'page is up');

    nock('https://ragingflame.co.za')
      .persist()
      .get('/test-redirect')
      .reply(301, undefined, {
        'Location': 'http://redirecter.com/must-pass-2'
      });


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
      .reply(200, (uri, requestBody) => requestBody);

    nock('https://ragingflame.co.za')
      .get('/timeout')
      .delay(5000)
      .reply(200, 'Page is up');
    
    nock('https://ragingflame.co.za')
      .get('/content-search')
      .reply(200, 'The quick brown fox jumps over the lazy dog');

    nock('https://ragingflame.co.za')
      .get('/content-search-2')
      .reply(200, 'The quick brown fox jumps over the lazy dog');
      
    tcpServer = require('./tcpServer');
  });

  it('#1 should pass', function (done) {

    let ping = new Monitor({
      website: 'https://ragingflame.co.za/must-pass',
      interval: 1,
      config: {
        intervalUnits: 'seconds',
        generateId: true
      } 
    });

    ping.on('up', function (res, state) {
      expect(res.statusCode).to.equal(200);

      // check state props
      expect(state.id).to.be.a('string');
      expect(state.created_at).to.be.gt(0);
      expect(state.isUp).to.be.true;
      expect(state.website).to.equal('https://ragingflame.co.za/must-pass');
      expect(state.address).to.be.a('null');
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
      expect(res.statusCode).to.equal(200);
      expect(state.totalRequests).to.equal(1);
      ping.stop();
      done(new Error(res.statusMessage));
    });
  });


  it('#1.1 should have null id', function (done) {

    let ping = new Monitor({
      website: 'https://ragingflame.co.za/must-pass-4',
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
      expect(state.website).to.equal('https://ragingflame.co.za/must-pass-4');
      expect(state.address).to.be.a('null');
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
      expect(res.statusCode).to.equal(200);
      expect(state.totalRequests).to.equal(1);
      ping.stop();
      done(new Error(res.statusMessage));
    });
  });


  it('#2 should pass', function (done) {

    let ping = new Monitor({
      website: 'https://ragingflame.co.za/must-pass-1',
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
      expect(state.website).to.equal('https://ragingflame.co.za/must-pass-1');
      expect(state.address).to.be.a('null');
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
      done(new Error(res.statusMessage));
    });
  });


  it('#3 should throw error', function (done) {
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
      expect(state.id).to.be.a('string');
      expect(state.created_at).to.be.gt(0);
      expect(state.isUp).to.be.true;
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

  it('#4 should fail', function (done) {

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
      expect(state.id).to.be.a('string');
      expect(state.created_at).to.be.gt(0);
      expect(state.isUp).to.be.false;
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

  it('#5 should handle the stop event', function (done) {

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

  it('#6 should connect to tcp', function (done) {

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


  it('#7 should test redirect', function (done) {
    try {
      let pingRedirect = new Monitor({
        website: 'https://ragingflame.co.za/test-redirect',
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
        expect(state.website).to.equal('https://ragingflame.co.za/test-redirect');
        expect(state.address).to.be.a('null');
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
        expect(res.statusCode).to.equal(301);
        pingRedirect.stop();
        done(new Error(res.statusMessage));
      });
    }
    catch(e) {
      done();
    }
  });


  it('#8 should test httpOptions', function (done) {
    try {
      let pingHttp = new Monitor({
        website: 'https://ragingflame.co.za/test-http-options',
        interval: 500,
        intervalUnit: 'milliseconds',
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

  it('#9 should post body', function (done) {
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

  it('#10 should timeout request', function (done) {
    try {
      let pingHttp = new Monitor({
        website: 'https://ragingflame.co.za/timeout',
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
      website: 'https://ragingflame.co.za/content-search',
      interval: 0.1,
      expect: {
        contentSearch: 'fox'
      }
    });

    ping.on('up', function (res, state) {
      expect(res.statusCode).to.equal(200);

      // check state props
      expect(state.id).to.be.a('string');
      expect(state.created_at).to.be.gt(0);
      expect(state.isUp).to.be.true;
      expect(state.website).to.equal('https://ragingflame.co.za/content-search');
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

  it('#12 should fail content search', function (done) {

    let ping = new Monitor({
      website: 'https://ragingflame.co.za/content-search-2',
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
      expect(state.website).to.equal('https://ragingflame.co.za/content-search-2');
      expect(state.address).to.be.a('null');
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
        website: 'https://wrong.host.badssl.com',
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

  after(function (done) {
    tcpServer.close();
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
      expect(Utils.getFormatedDate()).to.include('2021');
    });
  });

  after(function (done) {
    done();
    process.exit();
  });
});

