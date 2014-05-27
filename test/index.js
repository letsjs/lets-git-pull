'use strict';

/*global it:true, describe:true, before:true*/
/*jshint unused:false*/
/*jshint expr:true*/

var
    chai = require('chai'),
    expect = chai.expect,
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    async = require('async'),
    lets = require('lets'),
    Letsfile = require('./Letsfile'),
    gitPull = require('../.'),
    config;

chai.should();
chai.use(sinonChai);


/* Spies
============================================================================= */

function setupSpies () {
  Object.keys(gitPull).forEach(function (func) {
    gitPull[func] = sinon.spy(gitPull[func]);
  });
}

setupSpies();


/* Tests
============================================================================= */

testThatHandlersHaveBeenCalled(
  ['deploy:setup'], 'testing', [{
    handler: gitPull.setup
  }]);

testThatHandlersHaveBeenCalled(
  ['connect', 'deploy:check', 'disconnect'], 'testing', [{
    handler: gitPull.check
  }]);

testThatHandlersHaveBeenCalled(
  ['deploy'], 'testing', [
    {
      handler: gitPull.first,
      count: 2
    },
    {
      handler: gitPull.update
    },
    {
      handler: gitPull.publish
    },
    {
      handler: gitPull.finish
    }
  ]);

testThatHandlersHaveBeenCalled(
  ['connect', 'deploy:cleanup', 'disconnect'], 'testing', [{
    handler: gitPull.cleanup
  }]);

lets.logger.on('error', function () {});

/* Helpers
============================================================================= */

function testThatHandlersHaveBeenCalled (tasks, stage, handlers) {
  var loadedFile = lets.load(Letsfile);

  describe(tasks.join(', '), function () {
    this.timeout(5000);

    before(function (done) {
      async.eachSeries(tasks, function (task, next) {
        lets.runTasks(loadedFile, task, stage, next);
      }, done);
    });

    handlers.forEach(function (handler, i) {
      var count = handler.count || 1;

      it('should have ran task handler #' + i + ' ' + count + ' times', function () {
        handler.handler.should.have.been.callCount(count);
      });
    });
  });
}
