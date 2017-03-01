const assert = require('assert');
const CF = require('./mock-aws');
const sinon = require('sinon');
const createStackFactory = require('../lib/create-stack');
const spylogger = require('./spy-logger');

describe('#create-stack', function(){
  const STACK_NAME = 'mock-stack'
  var createStack;

  beforeEach(function() {
    createStack = createStackFactory(spylogger.logger);
    describeStackEventsAsyncStub = sinon.stub(CF, 'describeStackEventsAsync');
    spylogger.spy.reset();
  })

  afterEach(function() {
    describeStackEventsAsyncStub.restore();
  })

  it('should log', function() {
    const completedEvent = {
      StackEvents: [
        {
          EventId: '1e2f3g4h',
          StackName: STACK_NAME,
          LogicalResourceId: STACK_NAME,
          ResourceType: 'AWS::CloudFormation::Stack',
          Timestamp: new Date(),
          ResourceStatus: 'CREATE_COMPLETE',
        }
      ]
    };
    describeStackEventsAsyncStub.onCall(0).returns(Promise.resolve(completedEvent));
    return createStack({StackName: STACK_NAME})
      .then(function(){
        // 1 INFO stmnt + 1 INFO stmnt for the event
        assert.equal(3, spylogger.spy.callCount);
      });
  })
});
