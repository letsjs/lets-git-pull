'use strict';

var lets = require('lets');
var u = require('./utils');

var programs = ['date', 'rm', 'mkdir', 'ln', 'cd', 'cp'];
var messages = [
  '',
  'The releases-directory does not exist. Run `lets deploy:setup <stage>` before deploying',
  'The shared-directory does not exist. Run `lets deploy:setup <stage>` before deploying',
  'git is not installed on the server. Install git or use `lets-copy` instead'
];
var programsOffset = messages.length;

// Create messages for other required programs
programs.forEach(function (message) {
  messages.push(message + ' is not installed');
});

module.exports = exports = function check (options, done) {
  this.getConnection(function (c) {
    // Check that required directories exists
    var command = 'command -v {0} >/dev/null 2>&1 || echo {1}';
    var tests = [
      u.format('test -d {0}/releases || echo 1', options.remotePath),
      u.format('test -d {0}/shared || echo 2', options.remotePath)
    ];

    // Check that required programs are installed
    tests.push(u.format(command, 'git', 3));

    programs.forEach(function (program, i) {
      tests.push(u.format(command, program, i + programsOffset));
    });

    c.exec(u.andand(tests), function (err, results) {
      if(err) {
        return lets.logger.error(err);
      }

      results.split('\n').forEach(function (result) {
        if(result && messages[result]) {
          lets.logger.error(options.host, messages[result]);
        }
      });

      done();
    });
  });
};

exports.messages = messages;
