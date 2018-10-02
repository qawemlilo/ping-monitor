# Website uptime Event Emitter

Ping-monitor (Node-Monitor) is a tool for monitoring your website's uptime. If the website is up or down an event is emitted.

Also see [Node Ping](https://github.com/qawemlilo/node-ping).

### Installation
```
npm install ping-monitor
```


### How to use
```
var Monitor = require('ping-monitor');

var myWebsite = new Monitor(options);

myWebsite.on(event, function(response) {
    // Do something with the response
});
```


### Options

- `website` (* required) - The url of the website to be monitored.
- `interval` (defaults to 15) - time interval(in minutes) for checking website availability.



### Emitted Events

- `up` - All is good website is up.
- `down` - Not good, website is down.
- `stop` - Fired when the monitor has stopped.



### response object

- `object.website` - website being monitored.
- `object.time` - time in milliseconds.
- `object.responseCode` - http response code.
- `object.responseMessage` -  http response code message.



### Example
```javascript
"use strict";

const Monitor = require('ping-monitor');


const myWebsite = new Monitor({
    website: 'http://www.ragingflame.co.za',
    interval: 10
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
```

### Change log

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
