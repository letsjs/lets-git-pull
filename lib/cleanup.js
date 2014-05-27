'use strict';

var async = require('async');
var u = require('./utils');

module.exports = function cleanup (options, done) {
  this.getConnection(function (c) {
    var exec = u.execCurry(c);

    async.series([
      // Remove lru revision according to options.keepRevisions
      exec([
        u.format('cd {0}', options.remotePath + '/releases'),
        u.format('ls -r1 | tail -n +{0} | xargs rm -r', (options.keepRevisions || 5) + 1)
      ])
    ], done);
  });
};
