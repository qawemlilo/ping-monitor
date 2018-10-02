"use strict";

const http = require('http');
const https = require('https');
const fs = require('fs');
const util = require('util');
const EventEmitter = require('events').EventEmitter;
const url = require('url');
const statusCodes = http.STATUS_CODES;


/*
    Monitor Constructor
*/
function Monitor (opts) {
  // default http request method
  this.method = 'GET';

  // holds website to be monitored
  this.website = '';

  // ping intervals in minutes
  this.interval = 15;

  // interval handler
  this.handle = null;

  // initialize the app
  this.init(opts);
}


/*
    Inherit from EventEmitter
*/
util.inherits(Monitor, EventEmitter);




Monitor.prototype.init = function (opts) {
  // opts.timeout ensures backward compatibility
  const interval = opts.interval || opts.timeout || 15;
  const website = opts.website;


  if (!website) {
      return this.emit('error', {msg: 'You did not specify a website to monitor'});
  }

  this.method = opts.method || this.method;
  this.website = website;

  this.interval = (interval * (60 * 1000));

  // start monitoring
  this.start();
}


Monitor.prototype.start = function () {
  const time = Date.now();

  console.log("\nMonitoring: " + this.website + "\nTime: " + this.getFormatedDate(time) + "\n");

  // create an interval for pings
  this.handle = setInterval(() => {
      this.ping();
  }, this.interval);
}


Monitor.prototype.stop = function () {
  clearInterval(this.handle);
  this.handle = null;

  this.emit('stop', this.website);
}


Monitor.prototype.ping = function () {
  const options = url.parse(this.website);
  let currentTime = Date.now();
  let req;


  options.method = this.method;

  if(this.website.indexOf('https:') === 0) {
    req = https.request(options, (res) => {
      this.latency = Date.now() - currentTime;

      // Website is up
      if (res.statusCode === 200) {
        this.isOk();
      }
      // No error but website not ok
      else {
        this.isNotOk(res.statusCode);
      }
    });
  }
  else {
    req = http.request(options, (res) => {
      this.latency = Date.now() - currentTime;

      // Website is up
      if (res.statusCode === 200) {
        this.isOk();
      }
      // No error but website not ok
      else {
        this.isNotOk(res.statusCode);
      }
    });
  }

  req.on('error', (err) => {
    this.isNotOk(500);
  });

  req.end();
}


Monitor.prototype.isOk = function () {
  let data = this.responseData(200, 'OK', this.website);

  this.emit('up', data);
}


Monitor.prototype.isNotOk = function (statusCode) {
  let msg = statusCodes[statusCode];
  let data = this.responseData(statusCode, msg, this.website);

  this.emit('down', data);
}


Monitor.prototype.getFormatedDate = function (time) {
  let currentDate = new Date(time);

  currentDate = currentDate.toISOString();
  currentDate = currentDate.replace(/T/, ' ');
  currentDate = currentDate.replace(/\..+/, '');

  return currentDate;
}


Monitor.prototype.responseData = function (statusCode, msg, website) {
  let data = {
    time: Date.now(),
    statusCode: statusCode,
    statusMessage: msg,
    website: website
  };

  return data;
}




module.exports = Monitor;
