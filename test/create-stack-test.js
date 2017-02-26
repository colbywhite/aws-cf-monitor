const assert = require('assert');
const createStackFactory = require('../lib/create-stack');
const spylogger = require('./spy-logger');

describe('#create-stack', function(){
  var createStack;

  before(function() {
    const mockAwsCreateStack = function(params, callback) {
      callback(null, {StackId: params.StackName});
    };
    createStack = createStackFactory({createStack: mockAwsCreateStack}, spylogger.logger);
  });

  beforeEach(function() {
    spylogger.spy.reset();
  })

  it('should log', function() {
    return createStack({StackName: 1})
      .then(function(){
        // 2 INFO statements
        assert.equal(2, spylogger.spy.callCount);
      });
  })
});
