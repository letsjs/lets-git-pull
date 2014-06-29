'use strict';

var async = require('async');
var u = require('./utils');

module.exports = function update (options, done) {
  var tempPath = options.remotePath + '/temp',
      server = this;

  server.getConnection(function (c) {
    var exec = u.execCurry(c);

    async.waterfall([
      // Get system time
      exec('date +%Y%m%d_%H%M%S'),
      function (time, next) {
        var currentPath = (options.remotePath + '/releases/' + time).trim();

        // Export current path for future/external reference
        server.config({
          currentPath: currentPath
        });

        async.series([
          // Ensure temporary dir for cloning is empty
          exec([
            u.format('rm -rf {0}', tempPath),
            u.format('mkdir -p {0}', tempPath)
          ]),

          // Shallow clone into temporary dir
          exec(u.format(
            'git clone {0} --branch {1} --depth 1 {2} --quiet',
            options.repository, (options.branch || 'master'), tempPath)),

          // Support submodules //## Not tested
          u.asyncIf(!options.submodules, u.skip, exec([
            u.format('cd {0}', tempPath),
            'git submodule init',
            'git submodule update --depth 1'
          ])),

          // Save revision in .REVISION
          exec([
            u.format('cd {0}', tempPath),
            u.format('git rev-parse HEAD > {0}', (options.revisionFile || '.REVISION'))
          ]),

          // Copy temp to time dir
          exec(u.format('cp -r {0} {1}', tempPath, currentPath))
        ], next);
      }
    ], done);
  });
};
