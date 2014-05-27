'use strict';

var async = require('async');
var u = require('./utils');

module.exports = function setup (options, done) {
  this.getConnection(function (c) {
    var exec = u.execCurry(c);

    // Create required directories
    async.series([
      exec('mkdir -p ' + options.remotePath + '/releases'),
      exec('mkdir -p ' + options.remotePath + '/shared')
    ], done);
  });
};
