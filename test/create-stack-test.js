const assert = require('assert');
const CF = require('./mock-aws');
const sinon = require('sinon');
const createStack = require('../lib/create-stack');
const spylogger = require('./spy-logger');

describe('#createStack', function(){
  const STACK_NAME = 'mock-stack'

  before(function() {
    process.env.CF_MONITOR_DELAY = '1'
  })

  beforeEach(function() {
    describeStackEventsAsyncStub = sinon.stub(CF, 'describeStackEventsAsync');
    spylogger.reset();
  })

  afterEach(function() {
    describeStackEventsAsyncStub.restore();
  })

  it('should wait for completion and log events', function() {
    const inProgressEvent = {
      StackEvents: [
        {
          EventId: '1a2b3c4d',
          StackName: STACK_NAME,
          LogicalResourceId: STACK_NAME,
          ResourceType: 'AWS::CloudFormation::Stack',
          Timestamp: new Date(),
          ResourceStatus: 'CREATE_IN_PROGRESS'
        }
      ]
    };
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
    describeStackEventsAsyncStub.onCall(0).returns(Promise.resolve(inProgressEvent));
    describeStackEventsAsyncStub.onCall(1).returns(Promise.resolve(completedEvent));
    return createStack({StackName: STACK_NAME})
      .then(function(finalStatus){
        assert.equal(finalStatus, 'CREATE_COMPLETE');
        // 1 INFO at the beginning and the end, then 1 for each event
        assert.equal(spylogger.callCount, 4);
      });
  })
});
