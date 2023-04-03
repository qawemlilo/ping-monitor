'use strict';

const net = require('net');
const utils = require('./utils');
const NS_PER_SEC = 1e9;


module.exports = function(options, callback) {
  const socket = new net.Socket();
  const startTime = process.hrtime();

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
    const diff = process.hrtime(startTime);
    const responseTime = utils.nanoToMilliseconds(diff[0] * NS_PER_SEC + diff[1]);

    let data = {
      address: options.address,
      port: options.port,
      responseTime: responseTime
    };

    socket.destroy();

    callback(error, data);
  });
};
