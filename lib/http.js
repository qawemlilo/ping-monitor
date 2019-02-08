"use strict";


const http = require('http');
const https = require('https');
const url = require('url');
const NS_PER_SEC = 1e9;


function nanoToMilliseconds(nanoseconds) {
  return Math.floor(nanoseconds / 1e6);

}


function nanoToSecongs(nanoseconds) {
  return Math.floor(nanoseconds / 1e9);
}


module.exports = function (opts, callback) {
  const options = url.parse(opts.website);

  let req;
  let startTime = process.hrtime();


  options.method = opts.method;

  if (opts.website.indexOf('https:') === 0) {
    req = https.request(options, (res) => {
      let diff = process.hrtime(startTime);
      let responseTime = nanoToMilliseconds(diff[0] * NS_PER_SEC + diff[1]);

      let data = {
        website: opts.website,
        responseTime: responseTime
      };

      callback(false, res, data);
    });
  }
  else {
    req = http.request(options, (res) => {
      let diff = process.hrtime(startTime);
      let responseTime = nanoToMilliseconds(diff[0] * NS_PER_SEC + diff[1]);

      let data = {
        website: opts.website,
        responseTime: responseTime
      };

      callback(false, res, data);
    });
  }

  req.on('error', (err) => {
    let diff = process.hrtime(startTime);
    let responseTime = nanoToMilliseconds(diff[0] * NS_PER_SEC + diff[1]);

    let data = {
      website: opts.website,
      responseTime: responseTime
    };

    callback(err, data);
  });

  req.end();
};
