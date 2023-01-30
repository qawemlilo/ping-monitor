'use strict';



const util = require('util');
const EventEmitter = require('events').EventEmitter;
const httpMonitor = require('./http');
const tcpMonitor = require('./tcp');
const utils = require('./utils');
const crypto = require('crypto');




function Monitor (opts = {}, state = {}) {
  EventEmitter.call(this);

  this.id = null;

  this.created_at = null;

  this.title = '';

  this.method = 'GET';

  this.website = null;

  this.address =  null;

  this.interval = 5;

  this.port = null;

  this.handle = null;

  this.isUp =  true;

  this.paused = false;

  this.totalRequests = 0;

  this.totalDownTimes = 0;

  this.lastDownTime = null;

  this.lastRequest = null;

  this.ignoreSSL = false;

  this.httpOptions = {};

  this.channels = [];

  this.expect = {
    statusCode: 200,
    contentSearch: null
  };

  this.config = {
    intervalUnits: 'minutes',
    generateId: true
  };

  // initialize the app
  this.init(opts, state);

  this.handleEvents();
}




// Inherit from EventEmitter
util.inherits(Monitor, EventEmitter);




Monitor.prototype.init = function (opts, state) {
  const currentState = this.mergeState(opts, state);

  if (currentState.config.generateId) {
    currentState.id = crypto.randomBytes(16).toString('hex');
  }

  if (currentState.website && currentState.address) {
    const msg = 'You can only specify either a website or ip address';

    return this.emit('error', new Error(msg));
  }

  if (!currentState.created_at) {
    currentState.created_at = Date.now();
  }

  if (currentState.ignoreSSL) {
    currentState.httpOptions.checkServerIdentity = () => false;
  }

  this.setState(currentState);

  if (this.website) {
    this.start('http');
  }
  else {
    this.start('tcp');
  }
};




Monitor.prototype.setState = function (state) {
  Object.keys(state).forEach((key) => {
    this[key] = state[key];
  });
};




Monitor.prototype.mergeState = function (opts = {}, state = {}) {
  const currentState = this.getState();
  const innnerObjects = {};
  const params = [...arguments];

  params.forEach((param) => {
    if (opts.config) {
      innnerObjects.config = Object.assign(currentState.config, param.config);
    }
    if (param.httpOptions) {
      innnerObjects.httpOptions = Object.assign(currentState.httpOptions, param.httpOptions);
    }
    if (param.expect) {
      innnerObjects.config = Object.assign(currentState.config, param.expect);
    }
  });

  return Object.assign(currentState, opts, state, innnerObjects);
};



Monitor.prototype.getState = function () {
  return {
    id: this.id,
    title: this.title,
    created_at: this.created_at,
    isUp:  this.isUp,
    website: this.website,
    address: this.address,
    port: this.port,
    totalRequests: this.totalRequests,
    totalDownTimes: this.totalDownTimes,
    lastDownTime: this.lastDownTime,
    lastRequest: this.lastRequest,
    interval: this.interval,
    paused: this.paused,
    httpOptions: this.httpOptions,
    method: this.method,
    ignoreSSL: this.ignoreSSL,
    expect: this.expect,
    config: this.config
  };
};




Monitor.prototype.start = function (protocol) {
  const host = this.website || this.address;
  const startTime = utils.getFormatedDate();

  const INTERVAL = utils.intervalUnits(this.interval, this.config.intervalUnits);

  /*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
  console.log(`\nMonitoring: ${host}\nTime: ${startTime}\n`);

  if (protocol === 'http') {
    this.pingHTTP();

    // create an interval for pings
    this.handle = setInterval(() => {
      this.pingHTTP();
    }, INTERVAL);
  }
  else {
    this.pingTCP();

    // create an interval for pings
    this.handle = setInterval(() => {
      this.pingTCP();
    }, INTERVAL);
  }
};


Monitor.prototype.stop = function () {
  let responseData = utils.responseData(
    200,
    this.website,
    0,
    this.address,
    this.port
  );

  this.clearInterval();

  this.emit('stop', responseData, this.getState());

  return this;
};


Monitor.prototype.pause = function () {
  if (this.handle) {
    this.clearInterval();
  }

  this.paused = true;

  /*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
  console.log('%s has paused', this.title || this.website || this.address);

  return this;
};




Monitor.prototype.resume = function () {
  this.paused = false;

  if (this.website) {
    this.start('http');
  }
  else if (this.address) {
    this.start('tcp');
  }

  /*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
  console.log('%s has resumed', this.title || this.website || this.address);
};


Monitor.prototype.unpause = Monitor.prototype.resume;




Monitor.prototype.restart = function () {

  this.stop();

  if (this.website) {
    this.start('http');
  }
  else {
    this.start('tcp');
  }

  return this;
};


Monitor.prototype.clearInterval = function () {
  clearInterval(this.handle);
  this.handle = null;
};


Monitor.prototype.pingHTTP = function () {
  this.totalRequests += 1;
  this.lastRequest = Date.now();

  const options = {
    website: this.website,
    address: this.website,
    method: this.method,
    httpOptions: this.httpOptions
  };

  const handleResponse = (error, data, res) => {
    if(!error) {
      let bodyChunks = [];

      res.on('data', (chunk) => {
        bodyChunks.push(chunk);
      });

      res.on('end', () => {
        data.body = bodyChunks.join('');

        if (this.expect) {

          let isUp = true;

          // Check if actual status code matches the expected code.
          if (this.expect.statusCode) {
            isUp = isUp && (parseInt(res.statusCode , 10) === parseInt(this.expect.statusCode, 10));
          }

          // Checks if we can find the content within the response body.
          if (this.expect.contentSearch) {
            isUp = isUp && data.body.includes(this.expect.contentSearch);
          }


          if (isUp) {
            this.up();
          }
          else {
            this.down();
          }
        }
        else if (res.statusCode == 200) {
          this.up();
        }
        else {
          this.down();
        }

        this.respond(res.statusCode, data, error);
      });
    }
    else {
      this.down();

      this.respond(res.statusCode, data, error);
    }
  };

  process.nextTick(() => httpMonitor(options, handleResponse));
};


Monitor.prototype.pingTCP = function () {
  this.totalRequests += 1;
  this.lastRequest = Date.now();

  const handleResponse = (error, data) => {
    if (error) {
      this.down();
      this.respond(500, data, error);
    }
    else {
      this.up();
      this.respond(200, data);
    }
  };

  process.nextTick(() => {
    tcpMonitor({
      address: this.address,
      port: this.port || 0
    }, handleResponse);
  });
};


Monitor.prototype.respond = function (statusCode, data, error) {
  let responseData = utils.responseData(statusCode, this.website, data.responseTime, this.address, this.port);

  if (data.httpResponse) {
    responseData.httpResponse = data.httpResponse;
  }

  if (this.isUp) {
    this.emit('up', responseData, this.getState());
  }
  else {
    if (data.timeout) {
      this.emit('timeout', error, responseData, this.getState());
    }
    else if (error) {
      this.emit('error', error, responseData, this.getState());
    }
    else {
      this.emit('down', responseData, this.getState());
    }
  }
};




Monitor.prototype.down = function () {
  this.isUp = false;
  this.lastDownTime = Date.now();
  this.totalDownTimes += 1;
};




Monitor.prototype.up = function () {
  this.isUp = true;
};




Monitor.prototype.addChannel = Monitor.prototype.addNotificationChannel = function (channel) {
  if(!channel.name) {
    throw new Error('Missing Channel Property: name');
  }

  if(!this.channels.find(c => c.name === channel.name)) {
    this.channels.push(channel);
  }
};




Monitor.prototype.handleEvents = function () {
  this.on('up', (...args) => {
    if(this.channels.length) {
      this.channels.forEach((channel) => {
        channel.up && channel.up(...args);
      });
    }
  });

  this.on('down', (...args) => {
    if(this.channels.length) {
      this.channels.forEach((channel) => {
        channel.down && channel.down(...args);
      });
    }
  });

  this.on('stop', (...args) => {
    if(this.channels.length) {
      this.channels.forEach((channel) => {
        channel.stop && channel.stop(...args);
      });
    }
  });

  this.on('timeout', (...args) => {
    if(this.channels.length) {
      this.channels.forEach((channel) => {
        channel.timeout && channel.timeout(...args);
      });
    }
  });


  this.on('error', (...args) => {
    if(this.channels.length) {
      this.channels.forEach((channel) => {
        channel.error && channel.error(...args);
      });
    }
  });
};



module.exports = Monitor;
