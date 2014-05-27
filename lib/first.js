'use strict';

var logger = require('lets').logger;
var requiredFields = [
  'repository',
  'remotePath',
  'host',
  'username'
];

module.exports = function (options, next) {
  // Make sure required options are set, or abort
  var i, l;

  for (i = 0, l = requiredFields.length; i < l; i++) {
    if(!options[requiredFields[i]]) {
      logger.error('lets-git-pull: ' + requiredFields[i] + ' field required');

      return next(new Error('lets-git-pull: ' + requiredFields[i] + ' field required'));
    }
  }

  next();

  //## Set defaults explicitly on `this` (for fields like branch)?
};
