var assert = require('chai').assert;

var makeOptions = require('../index').makeOptions;


describe('makeOptions', function() {

  it('turns an object into options', function() {
    assert.deepEqual(makeOptions({thing: 'value'}),
                     ['--thing=value']);
  });

  it('makes multiple options', function() {
    assert.deepEqual(makeOptions({one: 'one', two: 'two'}).sort(),
                     ['--one=one', '--two=two']);
  });

  it('makes option flags for nulls', function() {
    assert.deepEqual(makeOptions({one: null}), ['--one']);
  });

  it('sets empty option values', function() {
    assert.deepEqual(makeOptions({one: ''}), ['--one=""']);
  });

});
