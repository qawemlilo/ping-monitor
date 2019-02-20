"use strict";

var http = require('http');
var https = require('https');
var fs = require('fs');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var url = require('url');
var statusCodes = http.STATUS_CODES;


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
  var interval = opts.interval || opts.timeout || 15;
  var website = opts.website;


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
  var time = Date.now();
  var self =  this;

  console.log("\nMonitoring: " + self.website + "\nTime: " + self.getFormatedDate(time) + "\n");

  // create an interval for pings
  self.handle = setInterval(function() {
      self.ping();
  }, self.interval);
}


Monitor.prototype.stop = function () {
  clearInterval(this.handle);
  this.handle = null;

  this.emit('stop', this.website);
}


Monitor.prototype.ping = function () {
  var options = url.parse(this.website);
  var currentTime = Date.now();
  var req;
  var self =  this;


  options.method = self.method;

  if(self.website.indexOf('https:') === 0) {
    req = https.request(options, function (res) {
      self.latency = Date.now() - currentTime;

      // Website is up
      if (res.statusCode === 200) {
        self.isOk();
      }
      // No error but website not ok
      else {
        self.isNotOk(res.statusCode);
      }
    });
  }
  else {
    req = http.request(options, function (res) {
      self.latency = Date.now() - currentTime;

      // Website is up
      if (res.statusCode === 200) {
        self.isOk();
      }
      // No error but website not ok
      else {
        self.isNotOk(res.statusCode);
      }
    });
  }

  req.on('error', function (err) {
    self.isNotOk(500);
  });

  req.end();
}


Monitor.prototype.isOk = function () {
  var data = this.responseData(200, 'OK', this.website);

  this.emit('up', data);
}


Monitor.prototype.isNotOk = function (statusCode) {
  var msg = statusCodes[statusCode];
  var data = this.responseData(statusCode, msg, this.website);

  this.emit('down', data);
}


Monitor.prototype.getFormatedDate = function (time) {
  var currentDate = new Date(time);

  currentDate = currentDate.toISOString();
  currentDate = currentDate.replace(/T/, ' ');
  currentDate = currentDate.replace(/\..+/, '');

  return currentDate;
}


Monitor.prototype.responseData = function (statusCode, msg, website) {
  var data = {
    time: Date.now(),
    statusCode: statusCode,
    statusMessage: msg,
    website: website
  };

  return data;
}




module.exports = Monitor;
