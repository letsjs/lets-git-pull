'use strict';

var async = require('async');
var u = require('./utils');


module.exports = function rollback (options, done) {
  var server = this;

  server.getConnection(function (c) {
    async.waterfall([
      function (next) {
        if(options.removeOldRevisionOnRollback === false) {
          return next();
        }

        c.exec(u.format('rm -rf {0}', options.oldRevision), next);
      }
    ], done);
  });
};
