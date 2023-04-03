'use strict';

const dgram = require('dgram');
const utils = require('./utils');
const NS_PER_SEC = 1e9;


module.exports = function(options, callback) {

  const startTime = process.hrtime();
  const client = dgram.createSocket('udp4');

  client.send('ping', options.port, options.address, (error) => {

    let diff = process.hrtime(startTime);
    let responseTime = utils.nanoToMilliseconds(diff[0] * NS_PER_SEC + diff[1]);
    let data = {
      address: options.address,
      port: options.port,
      responseTime: responseTime
    };

    if (error) {
      callback(error, data);
    }
    else {
      callback(false, data);
    }

    client.close();
  });
};
