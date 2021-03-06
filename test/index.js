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
    shouldExist: ['releases', 'shared']
  }
});

runTasksAndCompareState({
  describe: 'deploy:check',
  tasks: ['deploy:check'],
  stage: 'testing',
  shouldCall: [{
    handler: gitPull.check
  }],
  stateAfter: {
    shouldMatch: function () {
      return state.last;
    }
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
    shouldEqual: function () {
      return {
        'releases.length': state.last.releases.length + 1,
        'current.symlink': config.remotePath + '/releases/' +
          Object.keys(state.state.releases).sort().pop()
      };
    }
  }
});

// Just deploy again so there's something to rollback
runTasksAndCompareState({
  describe: 'deploy',
  tasks: ['deploy'],
  stage: 'testing',
  shouldCall: [
    {
      handler: gitPull.update,
      count: 2
    }
  ],
  stateAfter: {
    shouldEqual: function () {
      return {
        'releases.length': state.last.releases.length + 1,
        'current.symlink': config.remotePath + '/releases/' +
          Object.keys(state.state.releases).sort().pop()
      };
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
    shouldEqual: function () {
      return {
        'releases.length': state.state.releases.length < 5 ? state.state.releases.length : 5
      };
    }
  }
});

runTasksAndCompareState({
  describe: 'deploy:rollback',
  tasks: ['deploy:rollback'],
  stage: 'testing',
  shouldCall: [{
    handler: gitPull.rollback
  }],
  stateAfter: {
    shouldEqual: function () {
      var oldReleases = Object.keys(state.last.releases).sort();

      return {
        'current': config.remotePath + '/releases/' + oldReleases.slice(-2, -1)
      };
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
    Object.keys(options.stateAfter).forEach(function (comparator) {
      describe('After ' + options.describe, function () {
        var value = options.stateAfter[comparator];

        before(state.update.bind(state));

        it('server state ' + comparator + ' ' + value, function () {
          state[comparator](value);
        });
      });
    });
  }
}
