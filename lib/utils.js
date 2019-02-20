'use strict';

const statusCodes = require('http').STATUS_CODES;


module.exports.getFormatedDate = function () {
  let currentDate = new Date();

  currentDate = currentDate.toISOString();
  currentDate = currentDate.replace(/T/, ' ');
  currentDate = currentDate.replace(/\..+/, '');

  return currentDate;
};


module.exports.nanoToMilliseconds = function (nanoseconds) {
  return Math.floor(nanoseconds / 1e6);
};


module.exports.nanoToSecongs = function (nanoseconds) {
  return Math.floor(nanoseconds / 1e9);
};


module.exports.responseData = function (statusCode, website, responseTime, address, port) {
  let data = {
    time: responseTime,
    statusCode: statusCode,
    statusMessage: statusCodes[statusCode],
    website: website,
    responseTime: responseTime,
    address: address,
    port: port
  };

  return data;
};



module.exports.getFormatedDate = function () {
  let currentDate = new Date();

  currentDate = currentDate.toISOString();
  currentDate = currentDate.replace(/T/, ' ');
  currentDate = currentDate.replace(/\..+/, '');

  return currentDate;
};
