# Website uptime Event Emitter

Ping-monitor (Node-Monitor) is a tool for monitoring your website's uptime. If the website is up or down an event is emitted. This module is extracted from [Node Ping](https://github.com/qawemlilo/node-ping), an uptime app I wrote recently.

# Installation
```
npm install ping-monitor
```


# How to use
```
var Monitor = require('ping-monitor');

var myWebsite = new Monitor(options);

myWebsite.on(event, function(response) {
    // Do something with the response
});
```


## Options

- `website` (* required) - The url of the website to be monitored.
- `interval` (defaults to 15) - time interval(in minutes) for checking website availability.



## Emitted Events

- `up` - All is good website is up.
- `down` - Not good, website is down.
- `error` - Bad, http request module cannot load website.
- `stop` - Fired when the monitor has stopped.



## response object

- `object.website` - website being monitored.
- `object.time` - time in milliseconds.
- `object.responseCode` - http response code.
- `object.responseMessage` -  http response code message.



## Example
```
var Monitor = require('ping-monitor');


var myWebsite = new Monitor({
    website: 'http://www.ragingflame.co.za',
    interval: 10
});


myWebsite.on('error', function (msg) {
    console.log(msg);
});


myWebsite.on('up', function (res) {
    console.log('Yay!! ' + res.website + ' is up.');
});


myWebsite.on('down', function (res) {
    console.log('Oh Snap!! ' + res.website + ' is down! ' + res.statusMessage);
});


// this event is required to be handled in all Node-Monitor instances
myWebsite.on('error', function (res) {
    console.log('Oh Snap!! An unexpected error occured trying to load ' + res.website + '!');
    myWebsite.stop();
});


myWebsite.on('stop', function (website) {
    console.log(website + ' monitor has stopped.');
});
```


## Testing
```
node test
```


## License

(MIT License)

Copyright (c) 2013 Qawelesizwe Mlilo <qawemlilo@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
