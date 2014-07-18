'use strict';

/*global it:true, describe:true, before:true, after:true*/
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
    State = require('./State'),
    config = require('./config'),
    state;

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

state = new State(config);

before(function (done) {
  async.series([
    state.start.bind(state),
    state.update.bind(state)
  ], done);
});

/*describe('Before doing anything', function () {
  state.shouldBeEmpty();
});*/

testThatHandlersHaveBeenCalled(
  ['deploy:setup'], 'testing', [{
    handler: gitPull.setup
  }]);

describe('After setup', function () {
  before(state.update.bind(state));

  state.shouldEqual({
    'releases': true,
    'shared': true
  });
});

testThatHandlersHaveBeenCalled(
  ['deploy:check'], 'testing', [{
    handler: gitPull.check
  }]);

describe('After check, state should not have changed', function () {
  before(state.update.bind(state));

  state.shouldEqual(state.last);
});

testThatHandlersHaveBeenCalled(
  ['deploy'], 'testing', [
    {
      handler: gitPull.first,
      count: 3
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

describe('After deploy', function () {
  before(state.update.bind(state));

  state.shouldEqual({
    'releases.length': function () {
      return state.last.releases.length + 1;
    },
    'current.symlink': function () {
      return config.remotePath + '/releases/' + Object.keys(state.state.releases).sort().pop();
    }
  });
});

testThatHandlersHaveBeenCalled(
  ['deploy:cleanup'], 'testing', [{
    handler: gitPull.cleanup
  }]);

describe('After cleanup', function () {
  before(state.update.bind(state));

  state.shouldEqual({
    'releases.length': function () {
      return state.state.releases.length < 5 ? state.state.releases.length : 5;
    }
  });
});

after(state.end.bind(state));


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
