'use strict';

import net from 'net'

const server = net.createServer((connection) => {});

server.on('error', (err) => {
  throw err;
})

server.listen(8124, () => {
  console.log('TCP server running on 127.0.01:8124')
})

export default server
