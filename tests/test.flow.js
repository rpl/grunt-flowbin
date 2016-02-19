var flowBinPath = require('flow-bin');
var assert = require('chai').assert;
var sinon = require('sinon');
var grunt = require('grunt');

var flow = require('../tasks/flowbin').flow;
var PromiseTester = require('./util').PromiseTester;


describe('flow', function() {

  it('spawns a flow command with arguments', function() {
    var tester = new PromiseTester();
    var mockUtil = sinon.mock(grunt.util);
    tester.addMock(mockUtil);

    var args = ['check', '--color=always'];

    var spawn = mockUtil
      .expects('spawn')
      .withArgs({
        cmd: flowBinPath,
        args: args,
      });

    return tester
      .waitFor(function() {
        var promise = flow(grunt, args, {spawn: spawn});
        spawn.callArgWith(1, '<error>', '<result>', 0);
        return promise;
      })
      .then(function(spawnResult) {
        assert.equal(spawnResult, '<result>');
      });
  });

  it('throws for non-zero exits', function() {
    var tester = new PromiseTester();
    var mockUtil = sinon.mock(grunt.util);
    var spawn = mockUtil.expects('spawn');
    tester.addMock(mockUtil);

    return tester
      .waitFor(function() {
        var promise = flow(grunt, ['check'], {spawn: spawn});
        spawn.callArgWith(1, '<error>', '<result>', 1);
        return promise;
      })
      .then(function() {
        throw new Error('unexpected success');
      })
      .catch(function(error) {
        assert.match(error.message, /flow exited 1/);
      });
  });

  it('lets you bypass non-zero status codes', function() {
    var tester = new PromiseTester();
    var mockUtil = sinon.mock(grunt.util);
    var spawn = mockUtil.expects('spawn');
    tester.addMock(mockUtil);

    return tester
      .waitFor(function() {
        var promise = flow(grunt, ['check'], {
          spawn: spawn,
          validStatuses: [0, 127],
        });
        spawn.callArgWith(1, '<error>', '<result>', 127);
        return promise;
      });
  });

});
