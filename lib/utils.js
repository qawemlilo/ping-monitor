'use strict';


module.exports.nanoToMilliseconds = function (nanoseconds) {
  return Math.floor(nanoseconds / 1e6);
};


module.exports.nanoToSecongs = function (nanoseconds) {
  return Math.floor(nanoseconds / 1e9);
};



module.exports.getFormatedDate = function () {
  let currentDate = new Date();

  currentDate = currentDate.toISOString();
  currentDate = currentDate.replace(/T/, ' ');
  currentDate = currentDate.replace(/\..+/, '');

  return currentDate;
};



module.exports.intervalUnits = function (interval, unit) {
  const Millisecond = 1;
  const Second = 1000;
  const Minute = (60 * Second);
  const Hour = (Minute * 60);

  unit = unit || 'minutes';

  const Units = {
    milliseconds: Millisecond,
    seconds: Second,
    minutes: Minute,
    hours: Hour
  };

  return (interval * Units[unit]);
};
