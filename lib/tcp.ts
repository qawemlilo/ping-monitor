'use strict'

import { Socket } from 'net'
import * as utils from './utils'
import { Options, State } from './monitor';

const NS_PER_SEC = 1e9


export default (options: Options & State): Promise<{ error: any; data: any }> => {
  let socket: Socket = new Socket();
  let startTime: [number, number] = process.hrtime();

  return new Promise((resolve, reject) => {
    socket.connect(options.port ?? 1, options.address ?? '', function() {
      let diff = process.hrtime(startTime)
      let responseTime = utils.nanoToMilliseconds(diff[0] * NS_PER_SEC + diff[1])
      
  
      let data = {
        address: options.address,
        port: options.port,
        responseTime: responseTime
      }
  
      socket.destroy()
  
      resolve({ error: false, data })
    });
  
    socket.on('error', function(error) {
      let diff = process.hrtime(startTime)
      let responseTime = utils.nanoToMilliseconds(diff[0] * NS_PER_SEC + diff[1])
  
      let data = {
        address: options.address,
        port: options.port,
        responseTime: responseTime
      }
  
      socket.destroy()
  
      reject({ error, data })
    });
  })
};
