'use strict';

var letsGitPull = require('../.');
var pkg = require('../package');


module.exports = function (lets) {
  lets.config({
    repository: pkg.repository.url
  });

  var testing = lets.Stage()
    .config(require('./config'))
    .plugin(letsGitPull());

  // Add post callback placeholders for testing step-by-step
  Object.keys(exports).forEach(function (name) {
    testing.post(name, function () {
      exports[name].apply(this, arguments);
    });
  });

  lets.addStage('testing', testing);
};


// Post callback placeholders
exports.setup = function () {};
exports.update = function () {};
exports.publish = function () {};
exports.finish = function () {};
exports.cleanup = function () {};
