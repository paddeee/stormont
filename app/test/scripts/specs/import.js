var expect = require('chai').expect;
var should = require('should');
var ImportActions = require('../../../scripts/stores/import.js');

describe('Import', function() {

  it('should work', function() {
    expect('foo').to.not.equal('bar');
    expect({ foo: 'baz' }).to.have.property('foo')
      .and.not.equal('bar');
  });
});
