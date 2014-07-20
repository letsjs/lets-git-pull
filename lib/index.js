'use strict';

var
    lets = require('lets'),
    ssh = require('lets-ssh');


module.exports = exports = lets.plugin(function (stage, options) {
  // Use ssh connection
  stage.plugin(ssh(options));

  stage.on('deploy:setup', exports.setup);
  stage.on('deploy:check', exports.check);

  stage.on('first', exports.first);
  stage.on('deploy:update', exports.update);
  stage.on('deploy:publish', exports.publish);
  stage.on('deploy:finish', exports.finish);
  stage.on('deploy:cleanup', exports.cleanup);

  stage.on('deploy:rollback', exports.rollback);
  stage.on('deploy:finish_rollback', exports.finishRollback);
});

exports.setup = require('./setup');
exports.check = require('./check');
exports.cleanup = require('./cleanup');

exports.first = require('./first');
exports.update = require('./update');
exports.publish = require('./publish');
exports.finish = require('./finish');

exports.rollback = require('./rollback');
exports.finishRollback = require('./finish_rollback');

//exports.finish_rollback = require('./finish_rollback');
