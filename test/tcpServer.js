/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
'use strict';

const net = require('net');


const server = net.createServer((connection) => {});

server.on('error', (err) => {
  throw err;
});

server.listen(8124, () => {
  console.log('TCP server running on 127.0.01:8124');
  console.log();
});

module.exports = server;
