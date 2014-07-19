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

var onError = sinon.spy();
var onWarn = sinon.spy();
lets.logger.on('err', onError);
lets.logger.on('warn', onWarn);


/* Tests
============================================================================= */

state = new State(config);

before(state.start.bind(state));
before(state.update.bind(state));


runTasksAndCompareState({
  describe: 'deploy:setup',
  tasks: ['deploy:setup'],
  stage: 'testing',
  shouldCall: [{
    handler: gitPull.setup
  }],
  stateAfter: {
    'releases': true,
    'shared': true
  }
});

runTasksAndCompareState({
  describe: 'deploy:check',
  tasks: ['deploy:check'],
  stage: 'testing',
  shouldCall: [{
    handler: gitPull.check
  }],
  stateAfter: function () {
    return state.last;
  }
});

runTasksAndCompareState({
  describe: 'deploy',
  tasks: ['deploy'],
  stage: 'testing',
  shouldCall: [
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
  ],
  stateAfter: {
    'releases.length': function () {
      return state.last.releases.length + 1;
    },
    'current.symlink': function () {
      return config.remotePath + '/releases/' + Object.keys(state.state.releases).sort().pop();
    }
  }
});

runTasksAndCompareState({
  describe: 'deploy:cleanup',
  tasks: ['deploy:cleanup'],
  stage: 'testing',
  shouldCall: [{
    handler: gitPull.cleanup
  }],
  stateAfter: {
    'releases.length': function () {
      return state.state.releases.length < 5 ? state.state.releases.length : 5;
    }
  }
});


describe('lets.logger', function () {
  it('should not have emitted "err"', function () {
    onError.should.not.have.been.called;
  });

  it('should not have emitted "warn"', function () {
    onWarn.should.not.have.been.called;
  });
});

after(state.end.bind(state));


/* Helpers
============================================================================= */

function runTasksAndCompareState (options) {
  var loadedFile = lets.load(Letsfile);

  describe(options.describe, function () {
    this.timeout(5000);

    before(function (done) {
      async.eachSeries(options.tasks, function (task, next) {
        lets.runTasks(loadedFile, task, options.stage, next);
      }, done);
    });

    options.shouldCall.forEach(function (handler, i) {
      var count = handler.count || 1;

      it('should have ran task handler #' + i + ' ' + count + ' times', function () {
        handler.handler.should.have.been.callCount(count);
      });
    });
  });

  if(options.stateAfter) {
    describe('After ' + options.describe, function () {
      before(state.update.bind(state));

      state.shouldEqual(options.stateAfter);
    });
  }
}
