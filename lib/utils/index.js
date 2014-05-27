'use strict';


/**
 * Helper for executing commands in async's flow
 */

exports.execCurry = function (c) {
  return function exec (command) {
    if(arguments.length > 1) {
      throw new RangeError(
        'To many arguments supplied to exec(). Use an array to concat multiple commands');
    }

    if(Array.isArray(command)) {
      command = exports.andand.apply(null, command);
    }

    return function (next) {
      c.exec(command, next);
    };
  };
};

/**
 * Helper that calls the callback immediately, to be used in async as a
 * suplement for a function that is not needed for certain criterions.
 */

exports.skip = function (next) {
  next();
};

/**
 * If condition is true, use the first function, else use the second
 */

exports.asyncIf = function (condition, truthy, falsy) {
  return condition ? truthy : falsy;
};

/**
 * Helper for concatenating commands with && inbetween
 */

exports.andand = function () {
  return [].join.call(arguments, ' && ');
};

/**
 * Helper for formatting strings
 */

exports.format = function (string) {
  var args = Array.prototype.slice.call(arguments, 1);

  return string.replace(/{(\d+)}/g, function(match, number) {
    return typeof args[number] !== 'undefined' ?
      args[number] :
      match;
  });
};
