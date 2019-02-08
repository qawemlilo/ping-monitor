"use strict";


const http = require('http');
const util = require('util');
const EventEmitter = require('events').EventEmitter;
const httpMonitor = require('./http');
const tcpMonitor = require('./tcp');
const statusCodes = http.STATUS_CODES;
const NS_PER_SEC = 1e9;
const ONE_MINUTE = (60 * 1000);



/*
 *
 *Monitor Constructor
**/
function Monitor (opts) {

  EventEmitter.call(this);

  // default http request method
  this.method = 'GET';

  // holds website to be monitored
  this.website = '';

  // holds address to be monitored
  this.address =  '';

  // ping intervals in minutes
  this.interval = 15;

  // ping intervals in minutes
  this.port = 80;

  // interval handler
  this.handle = null;

  // initialize the app
  this.init(opts);

  return this;
}


/*
    Inherit from EventEmitter
*/
util.inherits(Monitor, EventEmitter);




Monitor.prototype.init = function (opts) {
  // opts.timeout ensures backward compatibility
  const interval = opts.interval || opts.timeout || 15;
  const website = opts.website ||  null;
  const address = opts.address || null;
  const port = opts.port || this.port;
  const method  = opts.method || this.method;



  this.method = opts.method || this.method;
  this.website = website;
  this.address = address;
  this.interval = interval * ONE_MINUTE;
  this.port = port;

  if (!website && !address) {
      return this.emit('error', new Error('You did not specify a website to monitor'));
  }
  else if (website && address) {
      return this.emit('error', new Error('You can only specify either a website or a tcp address'));
  }
  // start monitoring

  if (website) {
    this.start('http');
  }
  else {
    this.start('tcp');
  }
}


Monitor.prototype.start = function (method) {
  let host = this.website || this.address + ':' + this.port;
  let startTime = this.getFormatedDate();

  console.log("\nMonitoring: " + host + "\nTime: " + startTime + "\n");

  if (method === 'http') {
    // create an interval for pings
    this.handle = setInterval(() => {
        this.pingHTTP();
    }, this.interval);
  }
  else {
    // create an interval for pings
    this.handle = setInterval(() => {
        this.pingTCP();
    }, this.interval);
  }
}


Monitor.prototype.stop = function () {
  let host = this.website || this.address + ':' + this.port;

  clearInterval(this.handle);
  this.handle = null;

  this.emit('stop', host);
}


Monitor.prototype.pingHTTP = function () {
  httpMonitor({
    website: this.website,
    method: this.method
  }, (error, res, data) => {
    if (error) {
      this.emit('error', error)
    }
    else {
      this.response(res.statusCode, data);
    }
  });
}


Monitor.prototype.pingTCP = function () {
  tcpMonitor({
    address: this.address,
    port: this.port
  }, (error, data) => {
    if (error) {
      this.emit('error', error)
    }
    else {
      this.response(200, data);
    }
  });
}


Monitor.prototype.response = function (statusCode, data) {

  let responseData = this.responseData(statusCode, this.website, data.responseTime, this.address, this.port);

  if (statusCode === 200) {
    this.emit('up', responseData);
  }
  else {
    this.emit('down', responseData);
  }
}


Monitor.prototype.getFormatedDate = function () {
  let currentDate = new Date();

  currentDate = currentDate.toISOString();
  currentDate = currentDate.replace(/T/, ' ');
  currentDate = currentDate.replace(/\..+/, '');

  return currentDate;
}


Monitor.prototype.responseData = function (statusCode, website, responseTime, address, port) {
  let data = {
    time: responseTime,
    statusCode: statusCode,
    statusMessage: statusCodes[statusCode],
    website: website,
    responseTime: responseTime,
    address: address,
    port: port
  };

  return data;
}




module.exports = Monitor;
