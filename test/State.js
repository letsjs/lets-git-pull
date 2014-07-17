'use strict';

/*global it:true, describe:true*/
/*jshint expr:true*/

var Ssh = require('ssh2');
var expect = require('chai').expect;
var utils = require('../lib/utils');


var State = module.exports = exports = function State (options) {
  this.options = options;
  this.c = new Ssh();

  this.state = {};
  this.last = {};
};

State.prototype.start = function(callback) {
  this._connect(this.options, callback);
};

State.prototype.update = function(callback) {
  var self = this;

  self._exec(utils.format('find {0} -maxdepth 2', this.options.remotePath), function (err, state) {
    if(err) {
      return callback(err);
    }

    self.last = self.state;
    state = state.trim().split('\n').map(replaceRoot(self.options.remotePath + '/')).filter(Boolean);
    self.state = convertPathsToObject(state);

    callback();
  });
};

State.prototype.shouldEqual = function(comparers) {
  var self = this;

  Object.keys(comparers).forEach(function (key) {
    var value = comparers[key];

    describe('"' + key + '"', function () {
      if(value === true) {
        it('should exist', function () {
          expect(findByPath, self.state, key).to.exist;
        });
      }
      else if(value === false) {
        it('should not exist', function () {
          expect(findByPath, self.state, key).to.be.undefined;
        });
      }
      else if(typeof value === 'function') {
        it('should equal ' + value, function () {
          findByPath(self.state, key).should.equal(value());
        });
      }
      else {
        it('should equal ' + value, function () {
          findByPath(self.state, key).should.equal(value);
        });
      }
    });
  });
};


/* Private
============================================================================= */

State.prototype._connect = function(options, callback) {
  this.c.on('ready', callback).connect(options);
};

State.prototype._exec = function(command, callback) {
  this.c.exec(command, function (err, stream) {
    var error = '',
        result = '';

    if(err) {
      return callback(err);
    }

    stream.stderr.on('data', function (data) {
      error += data;
    });

    stream.on('data', function (data) {
      result += data;
    });

    stream.on('exit', function (code, signal) {
      var err = null;

      if(code) {
        err = new Error(error || result);
        err.code = code;
        err.signal = signal;
      }

      callback(err, result || error);
    });
  });
};


/* Helpers
============================================================================= */

function replaceRoot (root) {
  return function (path) {
    // Assume all paths start with root for now; I see no reason why they wouldn't
    return path.slice(root.length);
  };
}

function convertPathsToObject (paths) {
  var obj = {
    length: 0
  };

  paths.forEach(function (path) {
    var current = obj;

    path.split('/').forEach(function (level) {
      if(!current[level]) {
        current[level] = {
          length: 0
        };

        current.length++;
      }

      current = current[level];
    });
  });

  return obj;
}

function findByPath (element, path, separator) {
  var next, _element;

  separator = separator !== undefined ? separator : '.';
  
  path = path.split(separator);
  _element = element;
  
  while(path.length && _element) {
    next = path.shift();
    _element = _element[next];
  }
  
  return _element;
}
