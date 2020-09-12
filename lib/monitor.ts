'use strict'

import util from 'util'
import { EventEmitter } from 'events'

import { v4 as uuidv4 } from 'uuid'

import httpMonitor from './http'
import tcpMonitor from './tcp'

import * as utils from './utils'
import { ResponseData } from './utils'

export interface State {
  handle?: any | null
  active?: boolean | null
  isUp?: boolean | null
  paused?: boolean | null
  totalRequests?: number | null
  totalDownTimes?: number | null
  lastDownTime?: any | null
  lastRequest?: any | null
}

export interface Options {
  // General
  id?: string | number | null
  createdAt?: number | null
  title?: string | null
  // Options
  method?: string | null
  website?: string | null
  address?: string | null
  host?: string | null
  interval?: number | null
  port?: number | null
  httpOptions?: any | null
  expect?: any | null
}


export default class Monitor extends EventEmitter {
  // General
  id?: string | number | null
  createdAt: number | null
  title: string
  // Options
  method?: string | null
  website?: string | null
  address?: string | null
  host?: string | null// TCP/ UDP
  port?: number | null
  interval: number | null
  httpOptions: any
  expect: any
  // State
  handle?: any | null
  active: boolean
  isUp: boolean
  paused?: boolean | null
  totalRequests: number
  totalDownTimes: number
  lastDownTime: any | null
  lastRequest: any | null
  
  constructor(opts: Options, state?: Options & State) {
    super()
    
    // General
    this.id = null
    this.createdAt = null
    this.title = ''
    // Options
    this.method = 'GET'
    this.website = null
    this.address = null
    this.host = null // TCP/ UDP
    this.port = null
    this.interval = 5
    this.httpOptions = {}
    this.expect = {
      statusCode: 200,
      contentSearch: null
    };
  
    // State
    this.handle = null
    this.active = true
    this.isUp = true
    this.paused = null
    this.totalRequests = 0
    this.totalDownTimes = 0
    this.lastDownTime = null


    this.init(opts, state)
  }

  init(opts: Options, state?: State) {
    this.setProperties(opts, state)

    if (!this.active) {
      /*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
      return console.log(`${this.title} monitor is off`)
    }

    if (!this.website && !this.address) {
      return this.emit('error', new Error('You did not specify a website to monitor'))
    }
    else if (this.website && this.address) {
      return this.emit('error', new Error('You can only specify either a website or a tcp address'))
    }
    // start monitoring

    if (this.website) {
      this.start('http')
    }
    else {
      this.start('tcp')
    }
  }


  setProperties(opts: Options, state?: State) {
    const defaultState = this.getState()
    const currentState = Object.assign(defaultState, opts, state || {})

    currentState.host = currentState.website ||  currentState.address

    if (!currentState.createdAt) {
      currentState.createdAt = Date.now()
    }

    this.setState(currentState)
  }

  setState(state: any): void {
    for(const key of Object.keys(state)) {
      Object.assign(this, {[key]: state[key] })
    }
  }

  getState(): Options & State {
    return {
      id: this.id,
      title: this.title,
      createdAt: this.createdAt,
      isUp:  this.isUp,
      website: this.website,
      address: this.address,
      host: this.host,
      port: this.port,
      totalRequests: this.totalRequests,
      totalDownTimes: this.totalDownTimes,
      lastDownTime: this.lastDownTime,
      lastRequest: this.lastRequest,
      interval: this.interval,
      active: this.active,
      httpOptions: this.httpOptions,
      expect: this.expect
    }
  }

  start(method: string) {
    let host = this.website || this.address + ':' + this.port
    let startTime = utils.getFormatedDate()

    const ONE_MINUTE = (60 * 1000)
    const INTERVAL = (this.interval ?? 0) * ONE_MINUTE

    /*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
    console.log(`\nMonitoring:${host}\nTime: ${startTime}\n`)

    if (method === 'http') {
      this.pingHTTP()

      // create an interval for pings
      this.handle = setInterval(() => {
        this.pingHTTP()
      }, INTERVAL)
    }
    else {
      this.pingTCP()

      // create an interval for pings
      this.handle = setInterval(() => {
        this.pingTCP()
      }, INTERVAL)
    }
  }


  stop() {
    let responseData = new ResponseData(200, this.website ?? '', 0, this.address ?? '', this.port ?? 1)

    this.active = false

    clearInterval(this.handle)
    this.handle = null

    this.emit('stop', responseData, this.getState())

    return this
  }


  pause() {
    if (this.handle) {
      clearInterval(this.handle)
      this.handle = null
      this.paused = true

      /*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
      console.log('%s has paused', this.title || this.host)
    }
  }


  unpause() {
    if (this.website && this.active) {
      this.paused = false

      this.start('http')

      /*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
      console.log('%s has unpaused', this.title || this.host)
    }
    else if (this.address && this.active) {
      this.paused = false

      this.start('tcp')

      /*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
      console.log('%s has paused', this.title || this.host)
    }
  }


  restart() {
    this.active = true

    if (this.website) {
      this.start('http')
    }
    else {
      this.start('tcp')
    }

    return this
  }


  pingHTTP() {
    this.totalRequests += 1
    this.lastRequest = Date.now()

    const options: Options & State = {
      website: this.website,
      method: this.method,
      httpOptions: this.httpOptions
    }

    process.nextTick(async () => {
      try {
        let data: any = await httpMonitor(options)

        let bodyChunks: any[] = []
        data.res.on('data', (chunk: any) => {
          bodyChunks.push(chunk)
        })
        data.res.on('end', () => {
          data.body = bodyChunks.join('')
          
          if (this.expect) {
            let isUp = true
    
            // Check if actual status code matches the expected code.
            if (this.expect.statusCode) {
              isUp = isUp && (parseInt(data.res.statusCode , 10) === parseInt(this.expect.statusCode, 10))
            }
    
            // Checks if we can find the content within the response body.
            if (this.expect.contentSearch) {
              isUp = isUp && data.body.includes(this.expect.contentSearch)
            }

            this.isUp = isUp
            if (!isUp) {
              this.lastDownTime = Date.now()
              this.totalDownTimes = this.totalDownTimes ? this.totalDownTimes + 1 : 1
            }
          }
          else if (data.res.statusCode == 200) {
            this.isUp = true
          }
          else {
            this.isUp = false
            this.lastDownTime = Date.now()
            this.totalDownTimes += 1
          }

          data.httpResponse = data.res
    
          this.response(this.isUp, data.res.statusCode, data)
        })
      } catch (error) {
        this.isUp = false
        this.lastDownTime = Date.now()
        this.totalDownTimes += 1
  
        this.response(this.isUp, 500, error)
      }
    })
  }


  pingTCP() {
    this.totalRequests += 1
    this.lastRequest = Date.now()

    process.nextTick(async () => {
      try {
        const data = await tcpMonitor({
          address: this.address,
          port: this.port
        })

        this.isUp = true
        this.response(this.isUp, 200, data)
      } catch (error) {
        this.isUp = false
        this.lastDownTime = Date.now()
        this.totalDownTimes += 1
        
        error.data.error = error
        this.response(this.isUp, 500, error.data)
      }
    })
  }


  response(isUp: boolean, statusCode: number, data: any) {
    let responseData = new ResponseData(statusCode, this.website ?? '', data.responseTime, this.address ?? '', this.port ?? 1)

    if (data.httpResponse) {
      responseData.httpResponse = data.httpResponse
    }

    if (isUp) {
      this.emit('up', responseData, this.getState())
    }
    else {
      if (data.timeout) {
        this.emit('timeout', data.error, responseData, this.getState())
      }
      else if (data.error) {
        this.emit('error', data.error, responseData, this.getState())
      }
      else {
        this.emit('down', responseData, this.getState())
      }
    }
  }
}

process.on('uncaughtException', function (err) {
  /*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
  console.log('UNCAUGHT EXCEPTION', err)
  process.exit(1)
})