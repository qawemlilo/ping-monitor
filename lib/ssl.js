'use strict';

const https = require('https');
const NS_PER_SEC = 8.64e7;


function checkPort(port) {
  return !isNaN(parseFloat(port)) && Math.sign(port) === 1;
}
  

function getDaysBetween(validFrom, validTo) {
  return Math.round(Math.abs(+validFrom - +validTo) / NS_PER_SEC);
}


function getDaysRemaining(validFrom, validTo) {
  const daysRemaining = getDaysBetween(validFrom, validTo);

  if (new Date(validTo).getTime() < new Date().getTime()) {
    return -daysRemaining;
  }

  return daysRemaining;
}


const DEFAULT_OPTIONS = {
  agent: new https.Agent({
    maxCachedSessions: 0
  }),
  method: 'HEAD',
  port: 443,
  rejectUnauthorized: false,
};

function sslChecker(host, options) {
  return new Promise((resolve, reject) => {
    options = Object.assign({host:host}, DEFAULT_OPTIONS, options);

    if (!checkPort(options.port)) {
      reject(Error('Invalid port'));
      return;
    }

    try {
      const req = https.request(options, (res) => {
        const {
          valid_from,
          valid_to,
          subjectaltname,
        } = res.connection.getPeerCertificate();

        if (!valid_from || !valid_to || !subjectaltname) {
          reject(new Error('No certificate'));
          return;
        }

        const validTo = new Date(valid_to);

        const validFor = subjectaltname.replace(/DNS:|IP Address:/g, '').split(', ');

        resolve({
          daysRemaining: getDaysRemaining(new Date(), validTo),
          valid: res.socket.authorized || false,
          validFrom: new Date(valid_from).toISOString(),
          validTo: validTo.toISOString(),
          validFor,
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.abort();
        reject(new Error('Timed Out'));
      });
      req.end();
    } 
    catch (e) {
      reject(e);
    }
  });
}

sslChecker('theworkcrowd.com')
  .then(function (res) {
    /*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
    console.log(res);
  })
  .catch(function (error) {
    /*eslint no-console: ["error", { allow: ["warn", "error", "log"] }] */
    console.log(error);
  });
  
//module.exports = sslChecker;
