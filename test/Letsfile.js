'use strict';

var letsGitPull = require('../.');
var pkg = require('../package');


module.exports = function (lets) {
  lets.config({
    repository: pkg.repository.url
  });

  var testing = lets.Stage({
      tryKeyboard: true
    })
    .config(require('./config'))
    .plugin(letsGitPull());

  lets.addStage('testing', testing);
};
