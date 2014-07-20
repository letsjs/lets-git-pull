'use strict';

/*jshint expr:true*/

var Ssh = require('ssh2');
var expect = require('chai').expect;
var utils = require('../lib/utils');
var symlinkSeparator = '<>';


/**
 * Helper for getting and comparing the "state" of a directory on an SSH-server,
 * where "state" is what directories and files exists at the moment.
 */

var State = module.exports = exports = function State (options) {
  this.options = options;
  this.c = new Ssh();

  this.state = {};
  this.last = {};
};

State.prototype.start = function(callback) {
  this._connect(this.options, callback);
};

State.prototype.end = function(callback) {
  this.c.on('end', callback).end();
};

State.prototype.update = function(callback) {
  var self = this;
  var find = 'mkdir -p {0} && find {0} -maxdepth 2 -printf "%P{1}%l\\n"';

  self._exec(utils.format(find, this.options.remotePath, symlinkSeparator),
    function (err, state) {
      if(err) {
        return callback(err);
      }

      self.last = self.state;
      state = state.trim().split('\n').filter(Boolean);
      self.state = convertPathsToObject(state);

      callback();
    });
};

/**
 * Assert that the specified paths equals the expected value
 */
State.prototype.shouldEqual = function(paths) {
  var self = this;

  Object.keys(paths).forEach(function (key) {
    var value = paths[key];

    expect(findByPath(self.state, key)).to.equal(value());
  });
};

State.prototype.shouldMatch = function(value) {
  expect(this.state).to.eql((typeof value === 'function' ? value() : value));
};

/**
 * Assert that the specified paths exist
 */
State.prototype.shouldExist = function(paths) {
  var self = this;

  paths.forEach(function (path) {
    expect(findByPath(self.state, path)).to.exist;
  });
};

/**
 * Assert that the specified paths doesn't exist
 */
State.prototype.shouldNotExist = function(paths) {
  var self = this;

  paths.forEach(function (path) {
    expect(findByPath(self.state, path)).to.not.exist;
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

/**
 * Take an array of paths (eg `['/foo/bar', '/foo/boo /boo/hoo']`) to an object
 * representing the hierarchy
 * (eg `{foo: {*length: 2, bar:{}, boo:{*symlink: '/boo/hoo'}}}` where * denotes
 * unenumerable properties).
 */

function convertPathsToObject (paths) {
  var obj = createLengthObject();

  paths.forEach(function (path) {
    var current = obj;
    var symlink = path.split(symlinkSeparator)[1];

    path = path.split(symlinkSeparator)[0];

    path.split('/').forEach(function (level) {
      if(!current[level]) {
        current[level] = createLengthObject();

        current.length++;
      }

      current = current[level];
    });

    // Set symlink on last path segment
    if(symlink) {
      Object.defineProperty(current, 'symlink', {
        writable: true,
        enumerable: false,
        value: symlink
      });
    }
  });

  return obj;
}

/**
 * Create an object where `length` is not enumerable, so it can be used for
 * listing dir contents.
 */
function createLengthObject () {
  var obj = {};

  Object.defineProperty(obj, 'length', {
    writable: true,
    enumerable: false,
    value: 0
  });

  return obj;
}

/**
 * See https://github.com/ahultgren/findByPath
 */
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
