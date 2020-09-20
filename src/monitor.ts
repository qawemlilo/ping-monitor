'use strict'

import { EventEmitter } from 'events'

import WebProtocolHander from './protocols/web'
import TcpProtocolHander from './protocols/tcp'

import { Options } from 'got/dist/source'
import { MonitorError, MonitorHandler, MonitorResponse } from './protocols'

export interface WebProtocolOptions {
  url: string
  httpOptions: Options
  expect?: { contentSearch?: string; statusCode: number }
}

export interface TcpProtocolOptions {
  host: string
  port: number 
  options?: Record<string, any>
  expect?: Record<string, any>
}

export type SupportedProtocol = 'web' | 'tcp'
export type SupportedProtocolOptions = WebProtocolOptions | TcpProtocolOptions


export interface MonitorOptions {
    // General
    id: string | number
    readonly createdAt: number
    title: string
    // Options
    protocol: SupportedProtocol
    protocolOptions: SupportedProtocolOptions
    interval: number
}

export interface MonitorState {
  active?: boolean
  isUp?: boolean
  paused?: boolean
  totalRequests?: number
  totalDownTimes?: number
  lastDownTime?: any | null
  lastRequest?: any | null
}


const ProtocolHandlers: Record<SupportedProtocol, MonitorHandler> = {
  'web': new WebProtocolHander(),
  'tcp': new TcpProtocolHander(),
}



export default class Monitor extends EventEmitter {

  // General
  readonly id: string | number
  readonly createdAt: number
  readonly title: string
  // Options
  readonly protocol: SupportedProtocol
  readonly protocolOptions: SupportedProtocolOptions
  readonly interval: number
  // State
  private _intervalHandler: NodeJS.Timeout | null
  private _active: boolean
  private _isUp: boolean
  private _totalRequests: number
  private _totalDownTimes: number
  private _lastDownTime: any | null
  private _lastRequest: any | null

  constructor(opts: MonitorOptions, state?: MonitorState) {
    super()
    
    // General
    this.id = opts.id
    this.createdAt = Date.now()
    this.title = opts.title
    // Options
    this.protocol = opts.protocol
    this.protocolOptions = opts.protocolOptions
    this.interval = opts.interval ?? 5
  
    // State
    this._intervalHandler = null
    this._active = state?.active ?? true
    this._isUp = state?.isUp ?? false
    this._totalRequests = state?.totalRequests ?? 0
    this._totalDownTimes = state?.totalDownTimes ?? 0
    this._lastDownTime = null
    this._lastRequest = null

    if (!this._active) {
      console.log(`${this.title} (ID: ${this.id}) monitoring is initialised by not active.`)
    } else {
      this.start(true)
    }
  }

  public getState() {
    return {
      active: this._active,
      isUp: this._isUp,
      totalRequests: this._totalRequests,
      totalDownTimes: this._totalDownTimes,
      lastDownTime: this._lastDownTime,
      lastRequest: this._lastRequest
    }
  }

  private resetState(clearStats: boolean = false): void {
    if(this._intervalHandler) {
      clearInterval(this._intervalHandler)
    }
    this._intervalHandler = null
    this._active = false
    this._isUp = false

    if (clearStats) {
      this._totalRequests = 0
      this._totalDownTimes = 0
      this._lastDownTime = null
      this._lastRequest = null
    }
  }

  public start(force: boolean = false) {
    if(this._active && !force) {
      console.log(`${this.title} already started.`)
      return
    }
    this._active = true

    const ONE_MINUTE = (60 * 1000)
    const INTERVAL = (this.interval ?? 0) * ONE_MINUTE


    // Ping on start
    console.log(`${this.title} started`)
    this.emit('start', this)
    this.ping()

    // create an interval for regular pings
    this._intervalHandler = setInterval(() => { this.ping() }, INTERVAL)
  }

  public stop(clearStats: boolean = false): void {
    this.resetState(clearStats)
    console.log(`${this.title} stopped`)
    this.emit('stop', this)
  }

  public restart(clearStats: boolean = false): void {
    this.emit('restart', this)
    this.stop(clearStats)
    this.start()
  }

  private ping() {
    process.nextTick(async () => {
      this._totalRequests += 1
      this._lastRequest = Date.now()

      try {
        const response: MonitorResponse = await ProtocolHandlers[this.protocol].ping(this.protocolOptions)
        this._isUp = response.isUp
        this.emit(response.event, this, response)
      } catch (err) {
        this._lastDownTime = Date.now()
        this._totalDownTimes += 1

        if (err instanceof MonitorError) {
          this._isUp = err.response.isUp
          this.emit(err.response.event, this, err.response)
        } else {
          // Unexpected errors raised in MonitorHandler. Theoretically, should never get here!
          
          // Wrap the error in a MonitorResponse object, so event listeners can handle the error
          // similarly to how expected errors are handled.

          this._isUp = false

          const response: MonitorResponse = {
            event: 'error',
            isUp: false,
            responseTime: 0,
            error: err
          }

          this.emit(response.event, this, response)
        }
      } finally {
        this.emit('ping', this)
        await Promise.resolve()
      }
    })
  }
}
