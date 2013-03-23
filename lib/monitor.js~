var request = require('request'),
    statusCodes = require('http').STATUS_CODES,
    fs = require('fs'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter;
 
/*
    Ping Constructor
*/
function Ping (opts) {
    // holds website to be monitored
    this.website = '';
 
    // ping intervals in minutes
    this.timeout = 15;
 
    // interval handler
    this.handle = null;
 
    // initialize the app
    this.init(opts);
    
    return this;
}


/*
    Inherit from EventEmitter
*/
util.inherits(Ping, EventEmitter);



/*
    Methods
*/
 
Ping.prototype.init = function (opts) {
    var timeout = opts.timeout || 15,
        website = opts.website;
        
        
    if (!website) {
        this.emit('error', {msg: 'You did not specify a website to monitor'});
        
        return;
    }

    this.website = website;
 
    this.timeout = (timeout * (60 * 1000));
 
    // start monitoring
    this.start();
};




Ping.prototype.start = function () {
    var self = this,
        time = Date.now();
 
    console.log("\nMonitoring: " + self.website + "\nTime: " + self.getFormatedDate(time) + "\n");
 
    // create an interval for pings
    self.handle = setInterval(function () {
        self.ping();
    }, self.timeout);
};




Ping.prototype.stop = function () {
    clearInterval(this.handle);
    this.handle = null;
    
    this.emit('stop');
};




Ping.prototype.ping = function () {
    var self = this, currentTime = Date.now();
 
    try {
        // send request
        request(self.website, function (error, res, body) {
        
            // Website is up
            if (!error && res.statusCode === 200) {
                self.isOk();
            }
 
            // No error but website not ok
            else if (!error) {
                self.isNotOk(res.statusCode);
            }
 
            // Loading error
            else {
                self.isNotOk();
            }
        });
    }
    catch (err) {
        this.emit('error', {msg: 'The Request module failed to load your website'});
    }
};
 
 
 
 
Ping.prototype.isOk = function () {
    var data = this.responseData(200, 'OK');
    
    this.emit('up', data);
};




Ping.prototype.isNotOk = function (statusCode) {
    var msg = statusCodes[statusCode + ''],
        data = this.responseData(statusCode, msg);

 
    this.emit('down', data);
};




Ping.prototype.responseData = function (statusCode, msg) {
    var data = Object.create({}), time = Date.now();
 
    data.website = this.website;
    data.time = time;
    data.statusCode = statusCode;
    data.statusMessage = msg;
    
    return data;
};



Ping.prototype.getFormatedDate = function (time) {
    var currentDate = new Date(time);
    
    currentDate = currentDate.toISOString();
    currentDate = currentDate.replace(/T/, ' ');
    currentDate = currentDate.replace(/\..+/, '');
 
    return currentDate;
};




module.exports = Ping;

