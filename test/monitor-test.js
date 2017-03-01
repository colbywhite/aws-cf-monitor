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

  it('should keep monitoring until stack not found error', () => {
    const deleteStartEvent = {
      StackEvents: [
        {
          EventId: '1a2b3c4d',
          StackName: STACK_NAME,
          LogicalResourceId: STACK_NAME,
          ResourceType: 'AWS::CloudFormation::Stack',
          Timestamp: new Date(),
          ResourceStatus: 'DELETE_IN_PROGRESS'
        },
      ],
    };
    const stackNotFoundError = {
      message: 'Stack new-service-dev does not exist'
    };

    describeStackEventsAsyncStub.onCall(0).returns(Promise.resolve(deleteStartEvent));
    describeStackEventsAsyncStub.onCall(1).returns(Promise.resolve(stackNotFoundError));

    return testMonitor.monitor({StackId: STACK_NAME})
      .then(function(stackStatus) {
        assert.equal(2, describeStackEventsAsyncStub.callCount);
        assert.ok(describeStackEventsAsyncStub.calledWithExactly({StackName: STACK_NAME}));
        assert.equal('DELETE_COMPLETE', stackStatus);
        // 1 INFO at the beginning and the end, then 1 for each real event
        assert.equal(spylogger.spy.callCount, 3);
      });
  })

  it('should keep monitoring when 1st event is not "AWS::CloudFormation::Stack"', function() {
    const bucketEvent = {
      StackEvents: [
        {
          EventId: '1a2b3c4d',
          StackName: STACK_NAME,
          LogicalResourceId: 'somebucket',
          ResourceType: 'AWS::S3::Bucket',
          Timestamp: new Date()
        },
      ],
    };
    const progressEvent = {
      StackEvents: [
        {
          EventId: '1w2x3y4z',
          StackName: STACK_NAME,
          LogicalResourceId: STACK_NAME,
          ResourceType: 'AWS::CloudFormation::Stack',
          Timestamp: new Date(),
          ResourceStatus: 'UPDATE_IN_PROGRESS'
        },
      ],
    };
    const completedEvent = {
      StackEvents: [
        {
          EventId: '1m2n3o4p',
          StackName: STACK_NAME,
          LogicalResourceId: STACK_NAME,
          ResourceType: 'AWS::CloudFormation::Stack',
          Timestamp: new Date(),
          ResourceStatus: 'UPDATE_COMPLETE'
        },
      ],
    };

    describeStackEventsAsyncStub.onCall(0).returns(Promise.resolve(bucketEvent));
    describeStackEventsAsyncStub.onCall(1).returns(Promise.resolve(progressEvent));
    describeStackEventsAsyncStub.onCall(2).returns(Promise.resolve(completedEvent));

    return testMonitor.monitor({StackId: STACK_NAME})
      .then(function(stackStatus) {
        assert.equal(3, describeStackEventsAsyncStub.callCount);
        assert.ok(describeStackEventsAsyncStub.calledWithExactly({StackName: STACK_NAME}));
        assert.equal('UPDATE_COMPLETE', stackStatus);
        // 1 INFO at the beginning and the end, then 1 for each real event
        assert.equal(spylogger.spy.callCount, 5);
      });
  })


  statuses.forEach(function(state){
    const action = state.split('_')[0];

    it(`should keep monitoring until ${state} stack status`, function() {
      const inProgressEvent = {
        StackEvents: [
          {
            EventId: '1a2b3c4d',
            StackName: STACK_NAME,
            LogicalResourceId: STACK_NAME,
            ResourceType: 'AWS::CloudFormation::Stack',
            Timestamp: new Date(),
            ResourceStatus: `${action}_IN_PROGRESS`
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
            ResourceStatus: state
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
          // 1 INFO at the beginning and the end, then 1 for each event
          assert.equal(spylogger.spy.callCount, 4);
        });
    })

    it(`should not stop monitoring on ${state} nested stack status`, function() {
      const inProgressEvent = {
        StackEvents: [
          {
            EventId: '1a2b3c4d',
            StackName: STACK_NAME,
            LogicalResourceId: STACK_NAME,
            ResourceType: 'AWS::CloudFormation::Stack',
            Timestamp: new Date(),
            ResourceStatus: `${action}_IN_PROGRESS`
          }
        ]
      };
      const nestedStackEvent = {
        StackEvents: [
          {
            EventId: '1e2f3g4z',
            StackName: STACK_NAME,
            LogicalResourceId: 'nested-stack-name',
            ResourceType: 'AWS::CloudFormation::Stack',
            Timestamp: new Date(),
            ResourceStatus: state
          },
        ],
      };
      const completedEvent = {
        StackEvents: [
          {
            EventId: '1e2f3g4h',
            StackName: STACK_NAME,
            LogicalResourceId: STACK_NAME,
            ResourceType: 'AWS::CloudFormation::Stack',
            Timestamp: new Date(),
            ResourceStatus: state
          }
        ]
      };

      describeStackEventsAsyncStub.onCall(0).returns(Promise.resolve(inProgressEvent));
      describeStackEventsAsyncStub.onCall(1).returns(Promise.resolve(nestedStackEvent));
      describeStackEventsAsyncStub.onCall(2).returns(Promise.resolve(completedEvent));

      return testMonitor.monitor({StackId: STACK_NAME})
        .then(function(stackStatus) {
          assert.equal(3, describeStackEventsAsyncStub.callCount);
          assert.ok(describeStackEventsAsyncStub.calledWithExactly({StackName: STACK_NAME}));
          assert.equal(state, stackStatus);
          // 1 INFO at the beginning and the end, then 1 for each event
          assert.equal(spylogger.spy.callCount, 5);
        });
    })
  });

});
