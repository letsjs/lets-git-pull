'use strict';

var async = require('async');
var lets = require('lets');

var messages = [
  '',
  'The releases-directory does not exist, run `lets deploy:setup <stage>` before deploying',
  'The shared-directory does not exist, run `lets deploy:setup <stage>` before deploying',
  'Git is not installed on the server. Install git or use options.copy = true instead'
];

module.exports = function check (options, done) {
  this.getConnection(function (c) {
    // Check that required directories exists
    var tests = [
      c.exec.bind(c, 'test -d ' + options.remotePath + '/releases || echo 1'),
      c.exec.bind(c, 'test -d ' + options.remotePath + '/shared || echo 2')
    ];

    // Check that git is installed
    if(!options.copy) {
      tests.push(c.exec.bind(c, 'which git || echo 3'));
    }

    async.series(tests, function (err, results) {
      results.forEach(function (result) {
        if(result && messages[result]) {
          lets.logger.error(options.host, messages[result]);
        }
      });

      done();
    });
  });
};
