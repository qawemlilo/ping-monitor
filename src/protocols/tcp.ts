'use strict'

import { Socket } from 'net'
import * as utils from '../utils'
import { MonitorError, MonitorResponse, MonitorHandler } from '.';
import { TcpProtocolOptions } from '../monitor';
import { error } from 'console';

export default class TcpProtocolHandler implements MonitorHandler {
  async ping(options: TcpProtocolOptions): Promise<MonitorResponse> {
    let reaction: boolean = false
    let protocolHandlerResponse: MonitorResponse = {
      isUp: false,
      event: 'down',
      responseTime: 0
    }
    let socket: Socket = new Socket();
    socket.setTimeout(options.options?.timeout ?? 15000)
    let startTime: bigint = process.hrtime.bigint();

    socket.connect(options.port, options.host, () => {
      let endTime: bigint = process.hrtime.bigint()
      let responseTime: number = utils.nanoToMilliseconds(endTime - startTime)
      reaction = true
      socket.destroy()
  
      protocolHandlerResponse.isUp = true
      protocolHandlerResponse.responseTime = responseTime
      protocolHandlerResponse.data = socket
      protocolHandlerResponse.event = 'up'
    })

    socket.once('error', (err) => {
      let endTime: bigint = process.hrtime.bigint()
      let responseTime: number = utils.nanoToMilliseconds(endTime - startTime)
      reaction = true
      socket.destroy()

      protocolHandlerResponse.isUp = false
      protocolHandlerResponse.responseTime = responseTime
      protocolHandlerResponse.event = 'error'
      protocolHandlerResponse.error = err
    })

    socket.once('timeout', () => {
      let endTime: bigint = process.hrtime.bigint()
      let responseTime: number = utils.nanoToMilliseconds(endTime - startTime)
      reaction = true
      socket.destroy()

      protocolHandlerResponse.isUp = false
      protocolHandlerResponse.responseTime = responseTime
      protocolHandlerResponse.event = 'timeout'
      protocolHandlerResponse.error = new Error('connection timeout')
    })

    while(!reaction) { 
      console.log('Nope!')
      await utils.sleep(200)
    }
    console.log('Yeah!')
    
    if (protocolHandlerResponse.error) {
      throw new MonitorError(protocolHandlerResponse)
    } else {
      return protocolHandlerResponse
    }
  } 
}
