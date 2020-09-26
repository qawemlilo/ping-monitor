'use strict'

import got, { Response as GotResponse, TimeoutError as GotTimeoutError, RequestError as GotRequestError } from 'got'
import puppeteer from 'puppeteer'
// @ts-expect-error
import PuppeteerHar from 'puppeteer-har'
import { MonitorHandler, MonitorError, MonitorResponse } from '.'
import { WebProtocolOptions } from '../monitor'
import { Options } from 'got/dist/source'

type StrictOptions = Omit<Options, 'isStream' | 'responseType' | 'resolveBodyOnly' | '_cannotHaveBody' | '_progressCallbacks' | 'options' | 'requestInitialized' >

export default class WebProtocolHandler implements MonitorHandler { 

  async ping(options: WebProtocolOptions): Promise<MonitorResponse> {
    
    if(options.engine === 'got') { 
      return await this.pingViaGot(options)
    } else /*if(options.engine === 'puppeteer')*/ {
      return await this.pingViaPuppeteer(options)
    }
  }

  async pingViaPuppeteer(options: WebProtocolOptions): Promise<MonitorResponse> {
      const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()
    let har = new PuppeteerHar(page)
    await har.start()

    try {
      const timeout: number | undefined = typeof options.httpOptions.timeout === 'object' ? undefined : options.httpOptions.timeout
      const res: puppeteer.Response | null = await page.goto(options.url, { timeout })
      const metrics: puppeteer.Metrics = await page.metrics()
      const bodyHTML = await page.content()
      
      if (res === null) {
        return WebProtocolHandler.up(res, metrics.TaskDuration, await har.stop())
      }

      if (options.expect) {
        // Check if actual status code matches the expected code.
        if (options.expect.statusCode && res.status() !== options.expect.statusCode) {
          throw new MonitorError(WebProtocolHandler.down(res, metrics.TaskDuration, 'Expected status code did not match the actual status code recieved.', await har.stop()))
        }
  
        // Checks if we can find the content within the response body.
        if (options.expect.contentSearch && !bodyHTML.includes(options.expect.contentSearch)) {
          throw new MonitorError(WebProtocolHandler.down(res, metrics.TaskDuration, 'Expected content was not found in response body.', await har.stop()))
        }
        return WebProtocolHandler.up(res, metrics.TaskDuration, await har.stop())
      } else if ((res.status() >= 200 && res.status() <= 299) || res.status() == 304) {
        return WebProtocolHandler.up(res, metrics.TaskDuration, await har.stop())
      }
      else {
        throw new MonitorError(WebProtocolHandler.down(res, metrics.TaskDuration, 'Unsuccessful response.', await har.stop()))
      }

    } catch (error) {
      const metrics = await page.metrics()
      let harObj
      try {
        harObj = await har.stop()
      } catch (error) {}

      if (error instanceof puppeteer.errors.TimeoutError) {
        throw new MonitorError(WebProtocolHandler.timeout(error, metrics.TaskDuration, harObj))
      } else{
        throw new MonitorError(WebProtocolHandler.error(error, metrics.TaskDuration, harObj))
      }
    } finally {
      await browser.close()
    }
  }

  async pingViaGot(options: WebProtocolOptions): Promise<MonitorResponse> {
    const url: string = options.url
    const httpOptions: StrictOptions = Object.assign({}, options.httpOptions)
    httpOptions.throwHttpErrors = false
    
    let res: GotResponse<string> | undefined
    let duration: number

    try {
      res = await got(url, httpOptions)
      duration = res.timings.phases.total as number
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
      } else */if(err instanceof GotTimeoutError) {
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
        throw new MonitorError(WebProtocolHandler.down(res, duration, 'Expected status code did not match the actual status code recieved.'))
      }

      // Checks if we can find the content within the response body.
      if (options.expect.contentSearch && !res.body.includes(options.expect.contentSearch)) {
        throw new MonitorError(WebProtocolHandler.down(res, duration, 'Expected content was not found in response body.'))
      }
      return WebProtocolHandler.up(res, duration)
    } else if ((res.statusCode >= 200 && res.statusCode <= 299) || res.statusCode == 304) {
      return WebProtocolHandler.up(res, duration)
    }
    else {
      throw new MonitorError(WebProtocolHandler.down(res, duration, 'Unsuccessful response.'))
    }
  }

  static up(data: any, duration: number, traceroute?: any): MonitorResponse {
    return {
      isUp: true,
      responseTime: duration,
      event: 'up',
      data,
      traceroute
    }
  }

  static down(data: any, duration: number, reason: string, traceroute?: any): MonitorResponse {
    return {
      isUp: false,
      responseTime: duration,
      event: 'down',
      data,
      error: new Error(reason),
      traceroute
    } 
  }

  static timeout(error: Error, duration: number = 0, traceroute?: any): MonitorResponse {
    return {
      isUp: false,
      responseTime: duration,
      event: 'timeout',
      error,
      traceroute
    } 
  }

  static error(error: Error | string, duration: number = 0, traceroute?: any): MonitorResponse {
    return {
      isUp: false,
      responseTime: duration,
      event: 'error',
      data: (typeof error !== 'string' && error instanceof GotRequestError) ? error.response : undefined,
      error: typeof error === 'string' ? new Error(error) : error,
      traceroute
    }
  }
}
