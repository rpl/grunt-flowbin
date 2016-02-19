var grunt = require('grunt');
var assign = require('object-assign');
var when = require('when');
var assert = require('chai').assert;
var sinon = require('sinon');

var gruntTask = require('../tasks/flowbin');
var PromiseTester = require('./util').PromiseTester;


describe('grunt-task', function() {

  it('registers a task', function() {
    var tester = new PromiseTester();
    var gruntMock = sinon.mock(grunt)
    var registrationMock = gruntMock.expects('registerMultiTask');

    return tester
      .addMock(gruntMock)
      .tryCallback(function() {
        gruntTask(grunt, {registerMultiTask: registrationMock});
      });
  });

  it('calls an available command', function() {
    var availableCommands = {
      thing: sinon.spy(function() {
        return when.resolve();
      }),
    };
    var task = getTaskHandler({
      availableCommands: availableCommands,
    });

    var data = '<grunt data>';
    var args = '<grunt args>';
    return runTask(task, 'thing', data, args)
      .then(function() {
        var call = availableCommands.thing.args[0];
        assert.equal(call[0], grunt);
        assert.equal(call[1], data);
        assert.equal(call[2], args);
      })
  });

  it('fails the grunt task on error', function() {
    var availableCommands = {
      thing: function() {
        return when.reject(new Error('some command failed'));
      },
    };
    var task = getTaskHandler({
      availableCommands: availableCommands,
    });

    return runTask(task, 'thing', '<grunt data>', '<grunt args>')
      .then(function() {
        throw new Error('unexpected success');
      })
      .catch(function(error) {
        assert.match(error.message, /runTask\(\) was unsuccessful/);
      });
  });

  it('resorts to calling flow directly', function() {
    var flow = sinon.spy(function() {
      return when.resolve({});
    });
    var task = getTaskHandler({
      availableCommands: {},
      flow: flow,
    });

    return runTask(task, 'thing', {opt: 'value', flag: null})
      .then(function() {
        var call = flow.args[0];
        assert.equal(call[1][0], 'thing');
        assert.deepEqual(call[1].sort(),
                         ['--flag', '--opt=value', 'thing']);
      });
  });

  describe('checkForFlowErrors', function() {

    it('throws for a flow failure', function() {

      function flowStub() {
        return when.resolve({
          code: 2,  // this indicates a Flow error.
        });
      }

      return gruntTask.checkForFlowErrors(grunt, 'check', {}, {
          flow: flowStub,
        })
        .then(function() {
          throw new Error('unexpected success');
        })
        .catch(function(error) {
          assert.match(error.message, /check exited 2/);
        });
    });

    it('resolves on a 0 exit', function() {

      function flowStub() {
        return when.resolve({code: 0});
      }

      // Make sure no error is thrown.
      return gruntTask.checkForFlowErrors(grunt, 'check', {}, {
        flow: flowStub,
      });
    });

  });

});


function getTaskHandler(opt) {
  var taskHandler;
  opt = assign({}, opt, {
    registerMultiTask: function(name, description, handler) {
      taskHandler = handler;
    },
  });

  gruntTask(grunt, opt);
  return taskHandler;
}


function runTask(task, target, data, args) {
  data = data || {};
  return when.promise(function(resolve, reject) {

    var gruntCallback = function(successful) {
      if (successful) {
        resolve();
      } else {
        // TODO: turn on grunt logging to see errors.
        reject(new Error('fake runTask() was unsuccessful'));
      }
    };

    // TODO: there is probably a more direct way to create this
    // context with grunt code.
    var gruntContext = {
      async: function() {
        return gruntCallback;
      },
      target: target,
      data: data,
      args: args,
    };

    task.call(gruntContext);

  });
}
