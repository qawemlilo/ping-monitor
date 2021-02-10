# Uptime Event Emitter

An uptime event emitter for http and tcp servers.


### Installation
```
npm install ping-monitor
```


### How to use
```javascript
const Monitor = require('ping-monitor');

const myWebsite = new Monitor(options);

myWebsite.on(event, function(response, state) {
    // Do something with the response
});
```


### Methods

- `stop` - stop an active monitor 
- `restart` - stop and start an active monitor 

### Options

- `address` <String> - Server address to be monitored
- `website` <String> - Website address to be monitored
- `port` <Integer> - Server port (optional).
- `interval` <Integer> (defaults to 15 mins) - time interval for polling requests.
- `httpOptions` <Object> - allows you to define your http/s request with more control. A full list of the options can be found here: [https://nodejs.org/api/http.html#http_http_request_url_options_callback](https://nodejs.org/api/http.html#http_http_request_url_options_callback)
- `expect` <Object>  - allows you define what kind of a response you expect for your endpoint. At the moment expect accepts 1 prop (more to be added in future versions), `statusCode` a http status code.
- `config` <Object> { intervalUnits <String> }  - configuration for your Monitor, currently supports one property, `intervalUnits`. `intervalUnits` specifies which to time unit you want your Monitor to use. There are 4 options, `milliseconds`, `seconds`, `minutes` (default), and `hours`.
- `ignoreSSL` <Boolean> - ignore broken/expired certificates

#### Expect Object 
```javascript
expect {
  statusCode: Integer, // http status codes
  contentSearch: String
}
```

```javascript

// http Get
const myApi = new Monitor({
    website: 'http://api.ragingflame.co.za',
    title: 'Raging Flame',
    interval: 5,

    confing: {
      intervalUnits: 'minutes' // seconds, milliseconds, minutes {default}, hours
    },

    httpOptions: {
      path: '/users',
      method: 'get',
      query: {
        id: 3
      }
    },
    expect: {
      statusCode: 200
    }
});

// http Post
const myApi = new Monitor({
    website: 'http://api.ragingflame.co.za',
    title: 'Raging Flame',
    interval: 10, 
    
    confing: {
      intervalUnits: 'minutes' // seconds, milliseconds, minutes {default}, hours
    },

    httpOptions: {
      path: '/users',
      method: 'post',
      query: {
        first_name: 'Que',
        last_name: 'Fire'
      },
      body: 'Hello World!'
    },
    expect: {
      statusCode: 200
    }
});
```



### Emitted Events

- `up` - All is good website is up.
- `down` - Not good, website is down.
- `stop` - Fired when the monitor has stopped.
- `error` - Fired when there's an error
- `timeout` - Fired when the http request times out



### response object

- `object.website` - website being monitored.
- `object.address` - server address being monitored.
- `object.port` - server port.
- `object.time` - (aka responseTime) request response time.
- `object.responseMessage` -  http response code message.
- `object.responseTime` - response time in milliseconds.
- `object.httpResponse` - native http/s response object.

### state object

- `object.id` <Integer> `null` - monitor id, useful when persistence.
- `object.title` <String> `null` - monitor label for humans.
- `object.isUp` <Boolean> `true` - flag to indicate if monitored server is up or down.
- `object.created_at` <Date.now()> - monitor creation date.
- `object.isUp` <Boolean> `true` - current uptime status of the monitor.
- `object.port` <Integer> `null` - server port.
- `object.totalRequests` <Integer> `0` - total requests made.
- `object.totalDownTimes` <Integer> `0` - total number of downtimes.
- `object.lastDownTime` <Date.now()> - time of last downtime.
- `object.lastRequest` <Date.now()> - time of last request.
- `object.interval` <Integer> `5` - polling interval in minutes
- `object.website` <String> `null`  - website being monitored.
- `object.address` <String> `null`  - server address being monitored.
- `object.port` <Integer> `null` - server port.

### Website Example
```javascript
'use strict';

const Monitor = require('ping-monitor');


const myMonitor = new Monitor({
    website: 'http://www.ragingflame.co.za',
    title: 'Raging Flame',
    interval: 10 // minutes
});


myMonitor.on('up', function (res, state) {
    console.log('Yay!! ' + res.website + ' is up.');
});


myMonitor.on('down', function (res) {
    console.log('Oh Snap!! ' + res.website + ' is down! ' + res.statusMessage);
});


myMonitor.on('stop', function (website) {
    console.log(website + ' monitor has stopped.');
});


myMonitor.on('error', function (error) {
    console.log(error);
});
```

### TCP Example
```javascript
'use strict';

const Monitor = require('ping-monitor');


const myMonitor = new Monitor({
    address: '162.13.124.139',
    port: 8080,
    interval: 5 // minutes
});


myMonitor.on('up', function (res, state) {
    console.log('Yay!! ' + res.address + ':' + res.port + ' is up.');
});


myMonitor.on('down', function (res, state) {
    console.log('Oh Snap!! ' + res.address + ':' + res.port + ' is down! ');
});


myMonitor.on('stop', function (res, state) {
    console.log(res.address + ' monitor has stopped.');
});


myMonitor.on('error', function (error, res) {
    console.log(error);
});


myMonitor.on('timeout', function (error, res) {
    console.log(error);
});
```


### Change log

#### v0.6.1


**Changes**
 
 - Added auto id generation opt-out


```javascript
  let ping = new Monitor({
    website: 'https://google.com',
    interval: 5,
    config: {
      intervalUnits: 'minutes',
      generateId: false // defaults is true
    }
  });

  ping.on('up', function (res, state) {
    //state.id === null
    console.log('Yay!! Google is up');
  });
  

  ping.on('error', function (error, res) {
    console.error(error);
  });
```


#### v0.6.0


**Changes**
 
 - Code refactoring
 - Removed `active` from props (redundant)
 - Removed `host` from props (not used)
 - Added `ignoreSSL` to support websites with expired certificates


```javascript
  let ping = new Monitor({
    website: 'https://wrong.host.badssl.com',
    interval: 1,
    config: {
      intervalUnits: 'minutes' // seconds, milliseconds, minutes {default}, hours
    },
    ignoreSSL: true
  });

  ping.on('up', function (res, state) {
    console.log('Yay!! Service is up');
  });
  

  ping.on('error', function (error, res) {
    console.error(error);
  });
```


#### v0.5.2


**Changes**

 - Added support for configuring interval units

```javascript
  let ping = new Monitor({
    website: 'https://webservice.com',
    interval: 1,
    config: {
      intervalUnits: 'minutes' // seconds, milliseconds, minutes {default}, hours
    }
  });

  ping.on('up', function (res, state) {
    console.log('Yay!! Service is up');
  });
  

  ping.on('error', function (error, res) {
    console.error(error);
  });
```

#### v0.5.1


**Changes**

 - Added Support for content search in HTTP/HTTPS - courtesy of [@pbombnz](https://github.com/pbombnz)

```javascript
  let ping = new Monitor({
    website: 'https://ecommorce-shop.com/playstation5',
    interval: 0.1,
    expect: {
      contentSearch: 'In stock'
    }
  });

  ping.on('up', function (res, state) {
    console.log('Yay!! Content cantains the phrase "In stock"');
  });
  

  ping.on('error', function (error, res) {
    console.error(error);
  });
```

#### v0.5.0


**Changes**

 - Added `timeout` event to Monitor instance. This event is passed from the htt/s module.

```javascript
  myMonitor.on('timeout', function (error, res) {
    console.log(error);
  });
  
  // also make sure that you are handling the error event 
  myMonitor.on('error', function (error, res) {
    console.log(error);
  });
```

 - Dependencies update

*Please note:* When the `timeout` event is fired, it is followed by the `error` event which is created when we manually abort the http request.


#### v0.4.4

Dependencies update

#### v0.4.3


**Changes**

 - Added the native http/s response object in the `Monitor` response object
 - Added Post support in your Monitor instances.

You can now include a body in your `httpOptions`:

```javascript
// http Post
const myApi = new Monitor({
    website: 'http://api.ragingflame.co.za',
    title: 'Raging Flame',
    interval: 10 // minutes

    // new options
    httpOptions: {
      path: '/users',
      method: 'post',
      query: {
        first_name: 'Que',
        last_name: 'Fire'
      },
      body: 'Hello World!'
    },
    expect: {
      statusCode: 200
    }
});

myApi.on('up', function (res, state) {
  /*
    response {
      responseTime <Integer> milliseconds
      responseMessage <String> response code message
      website <String> url being monitored.
      address <String> server address being monitored
      port <Integer>
      httpResponse <Object> native http/s response object
    }

    state {
      created_at <Date.now()>
      isUp <Boolean>
      port: <Integer>
      totalRequests <Integer>
      lastDownTime <Date.now()>
      lastRequest <Date.now()>
      interval <Integer>
    }
  */
});
```

#### v0.4.2


**Changes**

Added some utility methods used when updating a monitor and added immediate ping on monitor creation.

  - Added `pause` method to Monitor.
  - Added `unpause` method to Monitor.


*Tip:* See [options](https://github.com/qawemlilo/node-monitor#options) section to learn how they work.

#### v0.4.1


**Changes**

Changes in v0.4.1 give you more control to define your http requests and what response to expect.


  - Added `httpOptions` prop to Monitor instance options.
  - Added `expect` prop for naming your your monitor.

*Tip:* See [options](https://github.com/qawemlilo/node-monitor#options) section to learn how they work.


#### v0.4.0


**Changes**

Most of the changes introduced in this version were introduced to support database persistence.

  - Added `id` prop, useful when you add database persistence.
  - Added `title` prop for naming your your monitor.
  - Added `active` prop to flag if monitoring is active.
  - Added `totalDownTimes` prop for keeping record of total downtimes.
  - Added `isUp` prop to indicate if monitored server is up or down.
  - Added `website`, `address`, `totalDownTimes`, `active`, `active` props to the emitted `state` object
  - Added eslinting (2015) and cleaned up the code a bit
  - *breaking change: * the `stop` event now takes a callback that accepts 2 arguments, `response` && `state` (same as the `up` and `down` events).


#### v0.3.1

**New Feature**

  - Added a `state` object in the response that returns useful monitoring data

  - **`State` object**

```javascript
  const Monitor = require('ping-monitor');

  const myMonitor = new Monitor(options);

  myMonitor.on(event, function(response, state) {
    /*
      response {...}  
      state {
        created_at <Date.now()>
        isUp <Boolean>
        port: <Integer>
        totalRequests <Integer>
        lastDownTime <Date.now()>
        lastRequest <Date.now()>
        interval <Integer>
      }
    */
  });
```

**Changes made**
  - The event handler now accepts to arguments `response` and `state`, please see above examples.



#### v0.3.0

  - Brought back `error` event - required for handling module usage related errors
  - Added `responseTime` to the response object
  - Added support for tcp servers


#### v0.2.0

  - Code cleanup and upgrade to ES6
  - Removed the `error` event - now being handled internally
  - Bug fixed: [Unreachable resource not handled #9](https://github.com/qawemlilo/node-monitor/issues/9)


## Testing
```
npm test
```


### License

(MIT License)

Copyright (c) 2013 - 2018 Qawelesizwe Mlilo <qawemlilo@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
