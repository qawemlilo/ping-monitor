'use strict';

const statusCodes = require('http').STATUS_CODES;


class MonitorResponse {

  constructor(res = {}, statusCode) {
    this.responseTime = res.responseTime || 0;
    this.time = res.responseTime || 0;
    this.address = res.address || null;
    this.website = res.address || null;
    this.port = res.port || null;
    this.statusCode = statusCode || null;
    this.statusMessage = statusCode ? statusCodes[statusCode] : null;
    this.responseMessage = statusCode ? statusCodes[statusCode] : null;

    if (res.httpResponse) {
      this.httpResponse = res.httpResponse;
    }

    return this.toObject();
  }


  toObject() {
    let res = {
      responseTime: this.responseTime,
      time: this.time,
      address: this.address,
      website: this.website,
      port: this.port,
      statusCode: this.statusCode,
      statusMessage: this.statusMessage,
      responseMessage: this.responseMessage
    };

    if (this.httpResponse) {
      res.httpResponse = this.httpResponse;
    }

    return Object.freeze(res);
  }
}

module.exports = MonitorResponse;
