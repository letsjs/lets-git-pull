'use strict';

var async = require('async');


module.exports = function finish (options, done) {
  var server = this;

  server.getConnection(function (c) {
    async.series([
      // Remove temp dir
      c.exec.bind(c, 'rm -rf ' + options.remotePath + '/temp')
    ], done);
  });
};
