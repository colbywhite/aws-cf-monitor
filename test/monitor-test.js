const assert = require('assert');
const CF = require('./mock-aws');
const sinon = require('sinon');
const Monitor = require('../lib/monitor');
const spylogger = require('./spy-logger');

describe('Monitor#monitorStack', function(){
  const STACK_NAME = 'mock-stack'
  var testMonitor;
  var describeStackEventsAsyncStub;
  const statuses = ['CREATE_COMPLETE', 'UPDATE_COMPLETE', 'DELETE_COMPLETE'];

  beforeEach(function() {
    spylogger.spy.reset();
    testMonitor = Monitor(spylogger.logger);
    describeStackEventsAsyncStub = sinon.stub(CF, 'describeStackEventsAsync');
  })

  afterEach(function() {
    describeStackEventsAsyncStub.restore();
  })

  statuses.forEach(function(state){
    it(`should keep monitoring until ${state} stack status`, function() {
      const action = state.split('_')[0];
      const inProgressEvent = {
        StackEvents: [
          {
            EventId: '1a2b3c4d',
            StackName: STACK_NAME,
            LogicalResourceId: STACK_NAME,
            ResourceType: 'AWS::CloudFormation::Stack',
            Timestamp: new Date(),
            ResourceStatus: `${action}_IN_PROGRESS`,
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
            ResourceStatus: state,
          }
        ]
      };

      describeStackEventsAsyncStub.onCall(0).returns(Promise.resolve(inProgressEvent));
      describeStackEventsAsyncStub.onCall(1).returns(Promise.resolve(completedEvent));

      return testMonitor.monitor({StackId: STACK_NAME})
        .then(function(stackStatus) {
          assert.equal(2, describeStackEventsAsyncStub.callCount);
          assert.ok(describeStackEventsAsyncStub.calledWithExactly({StackName: STACK_NAME}));
          assert.equal(state, stackStatus);
        });
    })
  });

});
