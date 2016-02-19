var when = require('when');


function PromiseTester() {
  this.finishCallbacks = [];
  this.successCallbacks = [];
}

exports.PromiseTester = PromiseTester;

PromiseTester.prototype.whenFinished = function(fn) {
  this.finishCallbacks.push(fn);
  return this;
};

PromiseTester.prototype.whenSuccessful = function(fn) {
  this.successCallbacks.push(fn);
  return this;
};

PromiseTester.prototype.addMock = function(mock) {
  return this
    .whenFinished(function() {
      mock.restore();
    })
    .whenSuccessful(function() {
      mock.verify();
    });
};

PromiseTester.prototype.onFinish = function() {
  this.finishCallbacks.forEach(function(fn) {
    try {
      fn();
    } catch (error) {
      // Ignore errors here because we might be recovering from
      // an exception.
      console.log('*** ignoring error in onFinish: ' + error);
    }
  });
};

PromiseTester.prototype.onSuccess = function() {
  this.successCallbacks.forEach(function(fn) {
    fn();
  });
};

PromiseTester.prototype.waitFor = function(makePromise) {
  var self = this;
  try {
    var promise = makePromise();
  } catch (error) {
    self.onFinish();
    throw error;
  }
  return promise
    .then(function(result) {
      self.onFinish();
      self.onSuccess();
      return result;
    })
    .catch(function(error) {
      self.onFinish();
      throw error;
    });
};

PromiseTester.prototype.tryCallback = function(callback) {
  return this.waitFor(function() {
    return when.resolve(callback());
  });
};
