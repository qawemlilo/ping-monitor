'use strict';

import net from 'net'

const server: net.Server = net.createServer()

server.once('error', (err) => {
  server.close()
  throw err;
})

server.listen(8124, () => {
  console.log('TCP server running on 127.0.01:8124')
})

export default server
