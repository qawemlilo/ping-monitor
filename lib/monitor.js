'use strict';

const EventEmitter = require('events');
const httpMonitor = require('./http');
const tcpMonitor = require('./tcp');
const udpMonitor = require('./udp');
const utils = require('./utils');
const crypto = require('crypto');

const TCPPORT = 80;
const UDPPORT = 53;
const ERRORCODE = 500;
const SUCCESSCODE = 200;




class Monitor extends EventEmitter {

  constructor(opts = {}, state = {}) {
    super();

    this.id = null;

    this.created_at = null;

    this.title = '';

    this.protocol = 'http';

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

    this.httpOptions = {
      method: 'GET'
    };

    this.channels = [];

    this.expect = {
      statusCode: SUCCESSCODE,
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


  init (opts, state) {
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

    if (
      currentState.ignoreSSL &&
      !currentState.httpOptions.checkServerIdentity
    ) {
      currentState.httpOptions.checkServerIdentity = () => false;
    }

    this.setState(currentState);

    this.startMonitor();
  }


  setState(state) {
    Object.keys(state).forEach((key) => {
      this[key] = state[key];
    });
  }


  mergeState(opts = {}, state = {}) {
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
  }


  getState() {
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
      ignoreSSL: this.ignoreSSL,
      expect: this.expect,
      config: this.config,
      protocol: this.protocol
    };
  }


  start(protocol) {
    const host = this.website || this.address;
    const startTime = utils.getFormatedDate();

    const INTERVAL = utils.intervalUnits(this.interval, this.config.intervalUnits);

    /*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
    console.log(`\nMonitoring: ${host}\nTime: ${startTime}\n`);

    switch (protocol) {
    case 'http':
    case 'https':
      this.pingHTTP();

      // create an interval for pings
      this.handle = setInterval(() => {
        this.pingHTTP();
      }, INTERVAL);
      break;

    case 'tcp':
      this.pingTCP();

      // create an interval for pings
      this.handle = setInterval(() => {
        this.pingTCP();
      }, INTERVAL);
      break;

    case 'udp':
      this.pingUDP();
      // create an interval for pings
      this.handle = setInterval(() => {
        this.pingUDP();
      }, INTERVAL);
      break;
    }
  }


  startMonitor() {
    if (this.website || this.protocol === 'http' || this.protocol === 'https') {
      this.start('http');
    }
    else if(this.protocol === 'tcp') {
      this.start('tcp');
    }
    else if(this.protocol === 'udp')  {
      this.start('udp');
    }
    else {
      this.emit('error', new Error('Unrecognised protocol - use http/s,tcp, or udp'));
    }

    return this;
  }


  stop() {
    let responseData = utils.responseData(
      SUCCESSCODE,
      this.website,
      0,
      this.address,
      this.port
    );

    this.clearInterval();

    this.emit('stop', responseData, this.getState());

    return this;
  }


  pause() {
    if (this.handle) {
      this.clearInterval();
    }

    this.paused = true;

    /*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
    console.log('%s has paused', this.title || this.website || this.address);

    return this;
  }



  resume() {
    this.paused = false;

    this.startMonitor();

    /*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
    console.log('%s has resumed', this.title || this.website || this.address);
  }


  restart() {
    this.stop();
    this.startMonitor();

    return this;
  }


  clearInterval() {
    clearInterval(this.handle);
    this.handle = null;
  }


  pingHTTP() {
    this.totalRequests += 1;
    this.lastRequest = Date.now();

    const options = {
      website: this.website,
      address: this.website,
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

          this.respond(res.statusCode, data, error);
        });
      }
      else {
        this.respond(res.statusCode, data, error);
      }
    };

    process.nextTick(() => httpMonitor(options, handleResponse));
  }


  isValidResponse(statusCode, data) {
    let isUp = false;

    if (this.expect) {
      let statusCodeMatches = true;
      let contentSearchMatches = true;

      if (this.expect.statusCode) {
        statusCodeMatches = (parseInt(statusCode, 10) === parseInt(this.expect.statusCode, 10));
      }

      if (this.expect.contentSearch) {
        contentSearchMatches = data.body.includes(this.expect.contentSearch);
      }

      isUp = statusCodeMatches && contentSearchMatches;
    }
    else if(statusCode === SUCCESSCODE) {
      isUp = true;
    }

    return isUp;
  }


  pingTCP() {
    this.totalRequests += 1;
    this.lastRequest = Date.now();

    const handleResponse = (error, res) => {
      if (error) {
        this.respond(ERRORCODE, res, error);
      }
      else {
        this.respond(SUCCESSCODE, res);
      }
    };

    process.nextTick(() => {
      tcpMonitor({
        address: this.address,
        port: this.port || TCPPORT
      }, handleResponse);
    });
  }


  pingUDP() {
    this.totalRequests += 1;
    this.lastRequest = Date.now();

    const handleResponse = (error, res) => {
      if (error) {
        this.respond(ERRORCODE, res, error);
      }
      else {
        this.respond(SUCCESSCODE, res);
      }
    };

    process.nextTick(() => {
      udpMonitor({
        address: this.address,
        port: this.port || UDPPORT
      }, handleResponse);
    });
  }


  respond(statusCode, data, error) {
    let isUp = this.isValidResponse(statusCode, data);
    let responseData = utils.responseData(statusCode, this.website, data.responseTime, this.address, this.port);

    if (data.httpResponse) {
      responseData.httpResponse = data.httpResponse;
    }

    if (isUp) {
      if(!this.isUp) {
        this.emit('restored', responseData, this.getState());
      }
      else {
        this.emit('up', responseData, this.getState());
      }

      this.up();
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

      this.down();
    }
  }


  down() {
    this.isUp = false;
    this.lastDownTime = Date.now();
    this.totalDownTimes += 1;
  }


  up() {
    this.isUp = true;
  }


  addChannel(channel) {
    if(!channel.name) {
      throw new Error('Missing Channel Property: name');
    }

    if(!this.channels.find(c => c.name === channel.name)) {
      this.channels.push(channel);
    }
  }


  handleEvents() {
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


    this.on('restored', (...args) => {
      if(this.channels.length) {
        this.channels.forEach((channel) => {
          channel.restored && channel.restored(...args);
        });
      }
    });
  }
}


Monitor.prototype.unpause = Monitor.prototype.resume;
Monitor.prototype.addNotificationChannel = Monitor.prototype.addChannel;

module.exports = Monitor;
