/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
'use strict';

const dgram = require('dgram');
const server = dgram.createSocket('udp4');

server.on('message', (msg, rinfo) => {
  console.log(`Received message from ${rinfo.address}:${rinfo.port}: ${msg}`);
  server.send('pong', rinfo.port, rinfo.address);
});

server.on('error', (err) => {
  throw err;
});

server.on('listening', () => {
  const address = server.address();
  console.log(`Server listening on ${address.address}:${address.port}`);
});

server.bind(1234);

module.exports = server;
