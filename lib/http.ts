'use strict'

import http from 'http'
import https from 'https'
import url from 'url'
import * as utils from './utils'
import { Options, State } from './monitor'

const NS_PER_SEC = 1e9

export default (opts: Options & State): Promise<{error?: any; data?: any; res?: any}> => {
  return new Promise((resolve, reject) => {
    // Make sure website exists.
    if (!opts.website) {
      reject(new Error('No website URL specified.'))
      return
    }

    const options = Object.assign(url.parse(opts.website), opts.httpOptions)

    let hasTLS: boolean = opts.website.indexOf('https:') === 0
    let requestFn = hasTLS ? https.request : http.request
    let req: http.ClientRequest
    let startTime = process.hrtime()

    req = requestFn(options, res => {
      let diff = process.hrtime(startTime)
      let responseTime = utils.nanoToMilliseconds(diff[0] * NS_PER_SEC + diff[1])

      let data = {
        website: opts.website,
        responseTime: responseTime
      }

      resolve({data, res })
    })

    req.on('error', err => {
      let diff = process.hrtime(startTime)
      let responseTime = utils.nanoToMilliseconds(diff[0] * NS_PER_SEC + diff[1])

      let data = {
        website: opts.website,
        responseTime: responseTime
      }

      reject(err)
    })

    req.on('timeout', () => {
      let diff = process.hrtime(startTime)
      let responseTime = utils.nanoToMilliseconds(diff[0] * NS_PER_SEC + diff[1])

      let data = {
        website: opts.website,
        responseTime: responseTime,
        timeout: true
      }

      // reject(new Error('Request timeout'))
      reject(data)
    })

    if (opts.httpOptions.method 
      && opts.httpOptions.method.toLocaleLowerCase() === 'post'
      && opts.httpOptions.body
    ) {
      req.write(JSON.stringify(opts.httpOptions.body))
    }
    
    // if user has specified request timeout, manually destroy
    if (opts.httpOptions.timeout) {
      req.setTimeout(opts.httpOptions.timeout, function() {
        req.abort ? req.abort() : req.destroy()
      })
    }

    req.end()
  })
}
