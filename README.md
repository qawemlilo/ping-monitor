# Uptime Event Emitter

Ping-monitor is an uptime event emitter for http and tcp servers.

Also see [Node Ping](https://github.com/qawemlilo/node-ping).

### Installation
```
npm install ping-monitor
```


### How to use
```javascript
const Monitor = require('ping-monitor');

const myWebsite = new Monitor(options);

myWebsite.on(event, function(response) {
    // Do something with the response
});
```


### Options

- `website` - The url of the website to be monitored (required is monitoring a website).
- `address` - Server address to be monitored (required if monitoring tcp server).
- `port` - Server port (required if monitoring tcp server).
- `interval` (defaults to 15) - time interval (in minutes) for polling requests.


### Emitted Events

- `up` - All is good website is up.
- `down` - Not good, website is down.
- `stop` - Fired when the monitor has stopped.
- `error` - Fired when there's an error within the module



### response object

- `object.website` - website being monitored.
- `object.address` - server address being monitored.
- `object.port` - server port being monitored.
- `object.responseTime` - time in milliseconds.
- `object.time` - (aka responseTime) request response time.
- `object.responseMessage` -  http response code message.
- `object.responseTime` - response time in milliseconds.


### Website Example
```javascript
"use strict";

const Monitor = require('ping-monitor');


const myWebsite = new Monitor({
    website: 'http://www.ragingflame.co.za',
    interval: 10 // minutes
});


myWebsite.on('up', function (res) {
    console.log('Yay!! ' + res.website + ' is up.');
});


myWebsite.on('down', function (res) {
    console.log('Oh Snap!! ' + res.website + ' is down! ' + res.statusMessage);
});


myWebsite.on('stop', function (website) {
    console.log(website + ' monitor has stopped.');
});


myWebsite.on('error', function (error) {
    console.log(error);
});
```

### TCP Example
```javascript
"use strict";

const Monitor = require('ping-monitor');


const myserver = new Monitor({
    address: '162.13.124.139',
    port: 8080,
    interval: 5 // minutes
});


myserver.on('up', function (res) {
    console.log('Yay!! ' + res.address + ':' + res.port + ' is up.');
});


myserver.on('down', function (res) {
    console.log('Oh Snap!! ' + res.address + ':' + res.port + ' is down! ');
});


myserver.on('stop', function (address) {
    console.log(address + ' monitor has stopped.');
});


myserver.on('error', function (error) {
    console.log(error);
});
```


### Change log

#### v0.3.0

  - Brought back `error` event - required for handling module usage related errors
  - Added `responseTime` to the response object
  - Added support for tcp servers


#### v0.2.0

  - Code cleanup and upgrade to ES5
  - Removed the `error` event - now being handled internally
  - Bug fixed: [Unreachable resource not handled #9](https://github.com/qawemlilo/node-monitor/issues/9)


## Testing
```
node test
```


### License

(MIT License)

Copyright (c) 2013 - 2018 Qawelesizwe Mlilo <qawemlilo@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
