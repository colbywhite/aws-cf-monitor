const assert = require('assert');
const sinon = require('sinon');
const monitor = require('../lib/monitor');
const spylogger = require('./spy-logger');

var cloudFormation = require('./mock-aws');

describe('#monitor', function(){
  const STACK_NAME = 'mock-stack'
  var testMonitor;
  var describeStackEventsAsyncStub;
  const statuses = ['CREATE_COMPLETE', 'UPDATE_COMPLETE', 'DELETE_COMPLETE'];

  before(function() {
    process.env.AWS_CF_MONITOR_DELAY = '1'
  })

  beforeEach(function() {
    spylogger.reset();
    describeStackEventsAsyncStub = sinon.stub(cloudFormation, 'describeStackEventsAsync');
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

    return monitor({StackId: STACK_NAME}, cloudFormation)
      .then(function(stackStatus) {
        assert.equal(describeStackEventsAsyncStub.callCount, 2);
        assert.ok(describeStackEventsAsyncStub.calledWithExactly({StackName: STACK_NAME}));
        assert.equal(stackStatus, 'DELETE_COMPLETE');
        // 1 INFO at the beginning and the end, then 1 for each real event
        assert.equal(spylogger.callCount, 3);
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

    return monitor({StackId: STACK_NAME}, cloudFormation)
      .then(function(stackStatus) {
        assert.equal(stackStatus, 'UPDATE_COMPLETE');
        assert.equal(describeStackEventsAsyncStub.callCount, 3);
        assert.ok(describeStackEventsAsyncStub.calledWithExactly({StackName: STACK_NAME}));
        assert.equal(stackStatus, 'UPDATE_COMPLETE');
        // 1 INFO at the beginning and the end, then 1 for each real event
        assert.equal(spylogger.callCount, 5);
      });
  })

  it('should throw an error and exit immediately if stack status *_FAILED', function() {
    const startEvent = {
      StackEvents: [
        {
          EventId: '1a2b3c4d',
          LogicalResourceId: STACK_NAME,
          ResourceType: 'AWS::CloudFormation::Stack',
          Timestamp: new Date(),
          ResourceStatus: 'UPDATE_IN_PROGRESS'
        },
      ],
    };
    const bucketFailedEvent = {
      StackEvents: [
        {
          EventId: '1e2f3g4h',
          LogicalResourceId: 'mochaS3',
          ResourceType: 'S3::Bucket',
          Timestamp: new Date(),
          ResourceStatus: 'CREATE_FAILED',
          ResourceStatusReason: 'Bucket already exists'
        },
      ],
    };
    const rollbackEvent = {
      StackEvents: [
        {
          EventId: '1i2j3k4l',
          LogicalResourceId: STACK_NAME,
          ResourceType: 'AWS::CloudFormation::Stack',
          Timestamp: new Date(),
          ResourceStatus: 'UPDATE_ROLLBACK_IN_PROGRESS'
        },
      ],
    };
    const rollbackFailedEvent = {
      StackEvents: [
        {
          EventId: '1m2n3o4p',
          LogicalResourceId: STACK_NAME,
          ResourceType: 'AWS::CloudFormation::Stack',
          Timestamp: new Date(),
          ResourceStatus: 'UPDATE_ROLLBACK_FAILED'
        },
      ],
    };

    describeStackEventsAsyncStub.onCall(0).returns(Promise.resolve(startEvent));
    describeStackEventsAsyncStub.onCall(1).returns(Promise.resolve(bucketFailedEvent));
    describeStackEventsAsyncStub.onCall(2).returns(Promise.resolve(rollbackEvent));
    describeStackEventsAsyncStub.onCall(3).returns(Promise.resolve(rollbackFailedEvent));

    return monitor({StackId: STACK_NAME}, cloudFormation)
      .then(function(){
        assert.ok(false, 'no error was thrown when stack status is *_FAILED');
      })
      .catch(function(err) {
        assert.ok(err);
        assert.equal(describeStackEventsAsyncStub.callCount, 2);
        assert.ok(describeStackEventsAsyncStub.calledWithExactly({StackName: STACK_NAME}));
        // 1 INFO at the beginning then 1 for each event until the failure
        // the 1 ERROR for the final failure
        assert.equal(spylogger.callCount, 4);
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

      return monitor({StackId: STACK_NAME}, cloudFormation)
        .then(function(stackStatus) {
          assert.equal(describeStackEventsAsyncStub.callCount, 2);
          assert.ok(describeStackEventsAsyncStub.calledWithExactly({StackName: STACK_NAME}));
          assert.equal(stackStatus, state);
          // 1 INFO at the beginning and the end, then 1 for each event
          assert.equal(spylogger.callCount, 4);
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

      return monitor({StackId: STACK_NAME}, cloudFormation)
        .then(function(stackStatus) {
          assert.equal(describeStackEventsAsyncStub.callCount, 3);
          assert.ok(describeStackEventsAsyncStub.calledWithExactly({StackName: STACK_NAME}));
          assert.equal(stackStatus, state);
          // 1 INFO at the beginning and the end, then 1 for each event
          assert.equal(spylogger.callCount, 5);
        });
    })
  });

});
