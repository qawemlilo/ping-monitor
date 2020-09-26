# Availability Monitor

An availability monitoring module to see the current status of web services. Currently, the only protocols supported are TCP and HTTP/HTTPS.

The initial codebase was forked from [qawemlilo](https://github.com/qawemlilo)'s [ping-monitor](https://github.com/qawemlilo/ping-monitor).
From here, the codebase was rewritten to suit my own personal projects. 
They both exist to do the same thing but work differently under the hood.

Some of these changes include:
*  Rewrote the codebase to Typescript. 
*  Follows the Object-oriented programming (OOP) paradigm.
*  Uses [got](https://github.com/sindresorhus/got) instead of the native Node `http` and `https` modules. The benefits include:
   * Handles all the weirdness the HTTP/HTTPS protocol can produce.
   * Supports Async / Await, avoiding callback-hell!
   * Built-in timing - Times various phases of the HTTP request process, so we don't have to.
   * Customizable - Users of this library can specify all the little details when handling requests. 
     E.g. Should we SSL verify or not? Should we follow redirects or not? etc.
     For more information on the options available, go to [got](https://github.com/sindresorhus/got).
*  Added ability to use [puppeteer](https://github.com/puppeteer/puppeteer) for monitoring on complex web-services such as Single Page Applications (SPA), web-services that rely on client-side JavaScript execution, etc.

## Installation
```
npm install availability-monitor
```


## Quick Usage
```javascript
const Monitor = require('availability-monitor')

const bbcNewsMonitor = new Monitor({
    id: 1,
    title: 'BBC News',
    createdAt: Date.now(),
    protocol: 'web',
    protocolOptions: {
        url: 'https://bbcnews.com',
        engine: 'got',
        httpOptions: {
            timeout: 30000 // 30 Seconds
        }
    },
    interval: 5
})

bbcNewsMonitor.on('up', function(monitor, response) {
    // Do something with the response
    console.log(`${monitor.title} is up. Response Time: ${response.responseTime}ms`)
})
```

## Testing
```
npm test
```

## Advanced Usage
### Constructor Options
The constructor accepts an `object` Object, used to specify the Monitor settings when creating a Monitor instance. Below describes the fields that can be accepted.

#### id
_Type:_ `number | string`

_Description:_

An identifier for this Monitor instance. Usually this identifier is a reference from sort of database, but it can be anything you want.

_Example:_
```javascript
// Using Numbers
1
// Using String (UUID in our case)
'954f330d-9376-43d4-830f-3b4d1f615ef'
```

#### createdAt
_Type:_ `number`

_Default:_ `Date.now()`

_Description:_

The date this Monitor was created.

#### title
_Type:_ `string`

_Description:_

A human-readable identifier for this Monitor instance.

_Example:_

If we were checking availability of `https://bbcnews.com`, our name could be `BBC News`


#### protocol
_Type:_ `SupportedProtocol`

`SupportedProtocol` is typed to accept one of the following:
* `web`
* `tcp`

_Description:_

Specifies the protocol used when checking the availability of a web-service.

#### protocolOptions
_Type:_ `SupportedProtocolOptions`

`SupportedProtocolOptions` is typed to accept one of the following:
* `WebProtocolOptions`
* `TcpProtocolOptions`

`WebProtocolOptions` is typed as an _object_ and acccepts the following:
* `url`
  
  _Type:_ `string`
  
  _Description:_
  
  The URL we would like to poll.

* `engine`
  
  _Type:_ `'got' | 'puppeteer'`
  
  _Description:_
  
  The library to use when checking the availablity. Different libraries are used for different situations.
  
  Use `got` for quick and easy availability monitoring on basic web services. This option is suitable for server-side-rendered/static websites, APIs, and any service that is not reliant on the execution of client-side JavaScript.
  
  Use `puppeteer` when the above doesn't work. Puppeteer provides control of a Chromium Browser over the DevTools Protocol. Essentially, you are checking availability via a fully-functional browser. This is helpful for SPA websites, dynamic content, producing a HAR Trace (which is done automatically).

  Technically, you could use `puppeteer` for all web-based monitoring, but it is inefficient to do so as you are loading a full-featured browser. This could impact performance negatively. and may increase your system requirements rapidly depending on how many web services you plan to monitor, you may need to increase your memory capacity.

  > Note: You do not have to install a Chromium browser yourself to use `puppeteer`. A supported version will be installed when running `npm install`.

* `httpOptions`

  _Type:_ `Options`
  
  _Description:_
  
  Visit [got's options](https://github.com/sindresorhus/got#options) and [NodeJS's https.request options](https://nodejs.org/api/https.html#https_https_request_options_callback) which will show you all the possible fields that are accepted.

  Note, if your `engine` of choice is `puppeteer`, the only option that can be used is `timeout`. `timeout` must be `number | undefined`. Using `Delays` will be ignored, and timeout will be set to the default instead (30000 ms ~ 30 seconds).

* `expect`
  
  _Type:_ `object | undefined`

  _Description:_

  Sometimes, connecting sucessfully is not enough. We require details to be expected in the response. This is where we specify such things.

  _Items:_
  * `statusCode`
    
    _Type:_ `number | undefined`

    _Description:_

    Specify a specific status code that we expect to be seen in the response.

  * `contentSearch`
    _Type:_ `string | undefined`

    _Description:_

    Specify a specific substring that we expect to be seen in the response body.

`TcpProtocolOptions` is typed as an _object_ and acccepts the following:
* `host`
 
  _Type:_ `string`
  
  _Description:_

  The host you are connecting to.
* `port`
  
  _Type:_ `number`
  
  _Description:_

  The port you are connecting to on the _host_.
* `options`
  
  _Type:_ `Record<string, any> | undefined`
  
  _Description:_

  Placeholder. This is not used for anything yet.

* `expect`
  
  _Type:_ `Record<string, any> | undefined`
  
  _Description:_

  Placeholder. This is not used for anything yet.
  

#### interval
_Type_: `number`

_Default_: `5` representing 5 minutes.

_Description:_

Number of minutes to wait before polling the web service again.


## Emitted Events
This module inherits `EventEmitter`. This means this module can be easily intergrated in other applications by listening to the events below:
- `up` - Web service is running successfully.
- `down` - Web service failed when expecting certain elements to be present in the response OR failed completely.
- `error` - Fired when there's an error caught.
- `timeout` - Fired when the request times out.
- `start` - Fired when the monitor has started.
- `stop` - Fired when the monitor has stopped.
- `restart` - Fired when the monitor is restarting.
- `ping` - Fired after the monitor has pinged the web-service. Occurs regardless if the web-service is up or down, produced an error or timed out.

For `start`, `stop`, `restart`, and `ping` events, only one argument is presented to event listeners, this being the `Monitor` instance itself.

For `error`, `timeout`, `up`, and `down` events, two arguments are presented to event listeners, this being the `Monitor` instance itself, and a `MonitorResponse` object.

### MonitorResponse object

#### isUp
_Type:_ `boolean`

_Description:_

A high-level approach to clarify if a web service is running or not.

#### responseTime
_Type:_ `number`

_Default:_ 0

_Description:_

The time taken from the start of the request to the end. If a value can not be determine due to some error in the request process, this will be set to 0.

#### error
_Type:_ `Error | undefined`

_Description:_

Set when `timeout` and `error` are triggered. Represents the error that was caught.

#### data
_Type:_ `any | undefined`

_Description:_

Generally, the response of a web service (such as a `got.Response` for Web Handlers), although does not have to be. Guranteed to exist when `up` and `down` are emitted.


#### traceroute
_Type:_ `any | undefined`

_Description:_

When the engine used is `puppeteer`, this variable holds a HTTP Archive format (HAR) that can be used to analyse the browser's network activity. To grahpically view a HAR, use (Google's HAR Analyzer)[https://toolbox.googleapps.com/apps/har_analyzer/].


### Monitor.getState() / State object

Contains some statistics and the state of this monitoring object.

#### active
_Type:_ `boolean`

_Description:_

Whether monitoring is actively polling or not.

#### isUp
_Type:_ `boolean`

_Description:_

A high-level approach to clarify if a web service is running or not.


#### totalRequests
_Type:_ `number`

_Description:_

Number of total requests made.

#### totalDownTimes
_Type:_ `number`

_Description:_

Number of total number of downtimes.

#### lastDownTime
_Type:_ `number`

_Default:_ `Date.now()`

_Description:_

Time of last downtime.

#### lastDownTime
_Type:_ `number`

_Default:_ `Date.now()`

_Description:_

Time of last request.
