'use strict';


const http = require('http');
const https = require('https');
const url = require('url');
const utils = require('./utils');
const NS_PER_SEC = 1e9;


module.exports = function (opts, callback) {
  const options = url.parse(opts.website);

  let req;
  let startTime = process.hrtime();


  options.method = opts.method;

  if (opts.website.indexOf('https:') === 0) {
    req = https.request(options, (res) => {
      let diff = process.hrtime(startTime);
      let responseTime = utils.nanoToMilliseconds(diff[0] * NS_PER_SEC + diff[1]);

      let data = {
        website: opts.website,
        responseTime: responseTime
      };

      callback(false, data, res);
    });
  }
  else {
    req = http.request(options, (res) => {
      let diff = process.hrtime(startTime);
      let responseTime = utils.nanoToMilliseconds(diff[0] * NS_PER_SEC + diff[1]);

      let data = {
        website: opts.website,
        responseTime: responseTime
      };

      callback(false, data, res);
    });
  }

  req.on('error', (err) => {
    let diff = process.hrtime(startTime);
    let responseTime = utils.nanoToMilliseconds(diff[0] * NS_PER_SEC + diff[1]);

    let data = {
      website: opts.website,
      responseTime: responseTime
    };

    callback(err, data, {
      statusCode: 500
    });
  });

  req.end();
};
