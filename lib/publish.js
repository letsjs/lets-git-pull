'use strict';

var async = require('async');
var u = require('./utils');


module.exports = function publish (options, done) {
  var server = this,
      current = options.remotePath + '/current';

  // Expose current symlink
  server.config({
    current: current
  });

  server.getConnection(function (c) {
    var exec = u.execCurry(c);

    async.series([
      // Symlink current to time dir
      exec(u.format('ln -nfs {0} {1}', options.currentPath, current))
    ], done);
  });
};
