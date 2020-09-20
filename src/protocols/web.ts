'use strict'

import got, { Response, TimeoutError, CacheError, ReadError, ParseError, UploadError, HTTPError, MaxRedirectsError, UnsupportedProtocolError, CancelError, RequestError } from 'got'
import { MonitorHandler, MonitorError, MonitorResponse } from '.'
import { WebProtocolOptions } from '../monitor'
import { Options } from 'got/dist/source'

export default class WebProtocolHandler implements MonitorHandler { 

  async ping(options: WebProtocolOptions): Promise<MonitorResponse> {
    type StrictOptions = Omit<Options, 'isStream' | 'responseType' | 'resolveBodyOnly' | '_cannotHaveBody' | '_progressCallbacks' | 'options' | 'requestInitialized' >
    
    const url: string = options.url
    const httpOptions: StrictOptions = Object.assign({}, options.httpOptions)
    httpOptions.throwHttpErrors = false
    
    let res: Response<string> | undefined
    
    try {
      res = await got(url, httpOptions)
    } catch(err) {
      //console.error(err)
      /*if(err instanceof CacheError) {
        throw new ProtocolHandlerError(WebProtocolHandler.error(err))
      } else if(err instanceof ReadError) {
        throw new ProtocolHandlerError(WebProtocolHandler.error(err))
      } else if(err instanceof ParseError) {
        throw new ProtocolHandlerError(WebProtocolHandler.error(err))
      } else if(err instanceof UploadError) {
        throw new ProtocolHandlerError(WebProtocolHandler.error(err))
      } else if(err instanceof HTTPError) {
        throw new ProtocolHandlerError(WebProtocolHandler.error(err))
      } else if(err instanceof MaxRedirectsError) {
        throw new ProtocolHandlerError(WebProtocolHandler.error(err))
      } else if(err instanceof UnsupportedProtocolError) {
        throw new ProtocolHandlerError(WebProtocolHandler.error(err))
      } else */if(err instanceof TimeoutError) {
        throw new MonitorError(WebProtocolHandler.timeout(err))
      }/* else if(err instanceof CancelError) {
        throw new ProtocolHandlerError(WebProtocolHandler.error(err))
      } */else {
        throw new MonitorError(WebProtocolHandler.error(err))
      }
    }

    if (options.expect) {
      // Check if actual status code matches the expected code.
      if (options.expect.statusCode && res.statusCode !== options.expect.statusCode) {
        throw new MonitorError(WebProtocolHandler.down(res, 'Expected status code did not match the actual status code recieved.'))
      }

      // Checks if we can find the content within the response body.
      if (options.expect.contentSearch && !res.body.includes(options.expect.contentSearch)) {
        throw new MonitorError(WebProtocolHandler.down(res, 'Expected content was not found in response body.'))
      }
      return WebProtocolHandler.up(res)
    } else if (res.statusCode >= 200 && res.statusCode <= 299) {
      return WebProtocolHandler.up(res)
    }
    else {
      throw new MonitorError(WebProtocolHandler.down(res, 'Unsuccessful response.'))
    }
  }

  static up(res: Response): MonitorResponse {
    return {
      isUp: true,
      responseTime: res.timings.phases.total as number,
      event: 'up',
      data: res
    } 
  }

  static down(res: Response, reason: string): MonitorResponse {
    return {
      isUp: false,
      responseTime: res.timings.phases.total as number,
      event: 'down',
      data: res,
      error: new Error(reason)
    } 
  }

  static timeout(err: TimeoutError): MonitorResponse {
    return {
      isUp: false,
      responseTime: err.timings.phases.total as number,
      event: 'timeout',
      error: err
    } 
  }

  static error(err: RequestError | Error | string, responseTime: number = 0): MonitorResponse {
    if (typeof err === 'string') {
      return {
        isUp: false,
        responseTime: responseTime,
        event: 'down',
        error: new Error(err)
      }
    } else if (err instanceof RequestError) {
      return {
        isUp: false,
        responseTime: err.timings?.phases.total as number,
        event: 'down',
        data: err.response ?? undefined,
        error: err
      }
    } else {
      return {
        isUp: false,
        responseTime: responseTime,
        event: 'down',
        error: err
      }
    }
  }
}
