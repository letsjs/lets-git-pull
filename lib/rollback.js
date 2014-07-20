'use strict';

var async = require('async');
var u = require('./utils');


module.exports = function rollback (options, done) {
  var server = this,
      current = options.remotePath + '/current',
      revisions = options.remotePath + '/releases';

  // Expose current symlink
  server.config({
    current: current
  });

  server.getConnection(function (c) {
    var exec = u.execCurry(c);

    async.waterfall([
      // Get old (current) revision
      exec(u.format('readlink {0}', current)),
      // Get new (previous) revision
      function (currentTarget, next) {
        var previous = 'find {0} -maxdepth 1 | sort -r | awk \'$0 < "{1}"{print;exit}\'';

        currentTarget = currentTarget.trim();

        // Expose old revision path
        server.config({
          oldRevision: currentTarget
        });

        c.exec(u.format(previous, revisions, currentTarget), next);
      },
      function (rollbackTo, next) {
        if(!rollbackTo) {
          return next(new Error('Could not find a revision to rollback to'));
        }

        // Expose new revision path
        server.config({
          currentPath: rollbackTo.trim()
        });

        next();
      }
    ], done);
  });
};
