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
        assert.equal(3, spylogger.callCount);
      });
  })
});
