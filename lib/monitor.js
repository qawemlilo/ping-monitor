'use strict';


const util = require('util');
const EventEmitter = require('events').EventEmitter;
const httpMonitor = require('./http');
const tcpMonitor = require('./tcp');
const utils = require('./utils');



function Monitor (opts, state) {

  EventEmitter.call(this);

  this.id = null;

  this.created_at = null;

  this.title = '';

  this.method = 'GET';

  this.website = null;

  this.address =  null;

  this.host =  null;

  this.interval = 5;

  this.port = null;

  this.handle = null;

  this.active = true;

  this.isUp =  true;

  this.paused = false;

  this.totalRequests = 0;

  this.totalDownTimes = 0;

  this.lastDownTime = null;

  this.lastRequest = null;

  this.httpOptions = {};

  this.expect = {
    statusCode: 200
  };


  // initialize the app
  this.init(opts, state);

  return this;
}


/*
    Inherit from EventEmitter
*/
util.inherits(Monitor, EventEmitter);




Monitor.prototype.init = function (opts, state) {

  this.setProperties(opts, state);

  if (!this.active) {
    /*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
    return console.log(`${this.title} monitor is off`);
  }

  if (!this.website && !this.address) {
    return this.emit('error', new Error('You did not specify a website to monitor'));
  }
  else if (this.website && this.address) {
    return this.emit('error', new Error('You can only specify either a website or a tcp address'));
  }
  // start monitoring

  if (this.website) {
    this.start('http');
  }
  else {
    this.start('tcp');
  }
};


Monitor.prototype.setProperties = function (opts, state) {
  const defaultState = this.getState();
  const currentState = Object.assign(defaultState, opts, state || {});

  currentState.host = currentState.website ||  currentState.address;

  if (!currentState.created_at) {
    currentState.created_at = Date.now();
  }

  this.setState(currentState);
};


Monitor.prototype.setState = function (state) {
  Object.keys(state).forEach((key) => {
    this[key] = state[key];
  });
};



Monitor.prototype.getState = function () {
  return {
    id: this.id,
    title: this.title,
    created_at: this.created_at,
    isUp:  this.isUp,
    website: this.website,
    address: this.address,
    host: this.host,
    port: this.port,
    totalRequests: this.totalRequests,
    totalDownTimes: this.totalDownTimes,
    lastDownTime: this.lastDownTime,
    lastRequest: this.lastRequest,
    interval: this.interval,
    active: this.active,
    httpOptions: this.httpOptions,
    expect: this.expect
  };
};


Monitor.prototype.start = function (method) {
  let host = this.website || this.address + ':' + this.port;
  let startTime = utils.getFormatedDate();

  const ONE_MINUTE = (60 * 1000);
  const INTERVAL = this.interval * ONE_MINUTE;

  /*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
  console.log(`\nMonitoring:${host}\nTime: ${startTime}\n`);

  if (method === 'http') {
    this.pingHTTP();

    // create an interval for pings
    this.handle = setInterval(() => {
      this.pingHTTP();
    }, INTERVAL);
  }
  else {
    this.pingTCP();

    // create an interval for pings
    this.handle = setInterval(() => {
      this.pingTCP();
    }, INTERVAL);
  }
};


Monitor.prototype.stop = function () {
  let responseData = utils.responseData(200, this.website, 0, this.address, this.port);

  this.active = false;

  clearInterval(this.handle);
  this.handle = null;

  this.emit('stop', responseData, this.getState());

  return this;
};


Monitor.prototype.pause = function () {
  if (this.handle) {
    clearInterval(this.handle);
    this.handle = null;
    this.paused = true;

    /*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
    console.log('%s has paused', this.title || this.host);
  }
};


Monitor.prototype.unpause = function () {
  if (this.website && this.active) {
    this.paused = false;

    this.start('http');

    /*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
    console.log('%s has unpaused', this.title || this.host);
  }
  else if (this.address && this.active) {
    this.paused = false;

    this.start('tcp');

    /*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
    console.log('%s has paused', this.title || this.host);
  }
};


Monitor.prototype.restart = function () {
  this.active = true;

  if (this.website) {
    this.start('http');
  }
  else {
    this.start('tcp');
  }

  return this;
};


Monitor.prototype.pingHTTP = function () {
  this.totalRequests += 1;
  this.lastRequest = Date.now();

  const options = {
    website: this.website,
    method: this.method,
    httpOptions: this.httpOptions
  };

  process.nextTick(() => {
    httpMonitor(options, (error, data, res) => {
      if (this.expect && this.expect.statusCode) {
        if (parseInt(res.statusCode , 10) === parseInt(this.expect.statusCode, 10)) {
          this.isUp = true;
        }
        else {
          this.isUp = false;
          this.lastDownTime = Date.now();
          this.totalDownTimes += 1;
        }
      }
      else if (res.statusCode == 200) {
        this.isUp = true;

      }
      else {
        this.isUp = false;
        this.lastDownTime = Date.now();
        this.totalDownTimes += 1;
      }

      data.error = error;
      data.httpResponse = res;

      this.response(this.isUp, res.statusCode, data);
    });
  });
};


Monitor.prototype.pingTCP = function () {
  this.totalRequests += 1;
  this.lastRequest = Date.now();

  process.nextTick(() => {
    tcpMonitor({
      address: this.address,
      port: this.port
    }, (error, data) => {
      if (error) {
        this.isUp = false;
        this.lastDownTime = Date.now();
        this.totalDownTimes += 1;

        data.error = error;

        this.response(this.isUp, 500, data);
      }
      else {
        this.isUp = true;

        this.response(this.isUp, 200, data);
      }
    });
  });
};


Monitor.prototype.response = function (isUp, statusCode, data) {
  let responseData = utils.responseData(statusCode, this.website, data.responseTime, this.address, this.port);

  if (data.httpResponse) {
    responseData.httpResponse = data.httpResponse;
  }

  if (isUp) {
    this.emit('up', responseData, this.getState());
  }
  else {
    if (data.error) {
      this.emit('error', data.error, responseData, this.getState());
    }
    else {
      this.emit('down', responseData, this.getState());
    }
  }
};


process.on('uncaughtException', function (err) {
  /*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
  console.log('UNCAUGHT EXCEPTION - keeping process alive:', err);
  process.exit(1);
});



module.exports = Monitor;
