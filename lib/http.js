'use strict';

const http = require('http');
const https = require('https');
const { URL } = require('url');
const utils = require('./utils');
const NS_PER_SEC = 1e9;

const ERRORCODE = 500;
const TIMEOUTCODE = 408;


function parseOptions(opts) {
  let parsedUrl = new URL(opts.address);

  const requestOptions = {
    protocol: parsedUrl.protocol,
    hostname: parsedUrl.hostname,
    port: parsedUrl.port,
    path: parsedUrl.pathname + parsedUrl.search,
    hash: parsedUrl.hash
  };

  return Object.assign(requestOptions, opts.httpOptions);
}


module.exports = function(opts, callback) {
  const options = parseOptions(opts);
  const startTime = process.hrtime();
  let req;


  function handleResponse(res)  {
    let diff = process.hrtime(startTime);
    let responseTime = utils.nanoToMilliseconds(
      diff[0] * NS_PER_SEC + diff[1]
    );

    let data = {
      address: opts.address,
      port: opts.port,
      responseTime: responseTime,
      httpResponse: res
    };

    callback(false, data, res);
  }

  if (opts.address.indexOf('https:') === 0) {
    req = https.request(options, handleResponse);
  }
  else {
    req = http.request(options, handleResponse);
  }


  req.on('error', err => {
    if (opts.httpOptions.timeout) {
      return;
    }

    let diff = process.hrtime(startTime);
    let responseTime = utils.nanoToMilliseconds(diff[0] * NS_PER_SEC + diff[1]);

    let data = {
      address: opts.address,
      port: opts.port,
      responseTime: responseTime
    };

    callback(err, data, {
      statusCode: ERRORCODE
    });
  });




  req.on('timeout', () => {
    let diff = process.hrtime(startTime);
    let responseTime = utils.nanoToMilliseconds(diff[0] * NS_PER_SEC + diff[1]);

    let data = {
      address: opts.address,
      port: opts.port,
      responseTime: responseTime,
      timeout: true
    };


    callback(new Error('Request timeout'), data, {
      statusCode: TIMEOUTCODE
    });
  });




  if (
    opts.httpOptions.method &&
    opts.httpOptions.method.toLocaleLowerCase() === 'post' &&
    opts.httpOptions.body
  )
  {
    req.write(JSON.stringify(opts.httpOptions.body));
  }

  // if user has specified request timeout, manually destroy
  if (opts.httpOptions.timeout) {
    req.setTimeout(opts.httpOptions.timeout, function() {
      req.abort ? req.abort() : req.destroy();
    });
  }

  req.end();
};
