'use strict';

const net = require('net');
const utils = require('./utils');
const NS_PER_SEC = 1e9;


module.exports = function(options, callback) {
  let socket = new net.Socket();
  let startTime = process.hrtime();

  socket.connect(options.port, options.address, function() {
    let diff = process.hrtime(startTime);
    let responseTime = utils.nanoToMilliseconds(diff[0] * NS_PER_SEC + diff[1]);

    let data = {
      address: options.address,
      port: options.port,
      responseTime: responseTime
    };

    socket.destroy();

    callback(false, data);
  });

  socket.on('error', function(error) {
    let diff = process.hrtime(startTime);
    let responseTime = utils.nanoToMilliseconds(diff[0] * NS_PER_SEC + diff[1]);

    let data = {
      address: options.address,
      port: options.port,
      responseTime: responseTime
    };

    socket.destroy();

    callback(error, data);
  });
};
