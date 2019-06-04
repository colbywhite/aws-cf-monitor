import AWS from 'aws-sdk';
import * as AWSMock from 'aws-sdk-mock';
import { DescribeStackEventsInput } from 'aws-sdk/clients/cloudformation';
import { Monitor } from './monitor';

describe('Monitor', () => {
    beforeEach(() => {
        AWSMock.setSDKInstance(AWS);
    });

    afterEach(() => {
        AWSMock.restore('CloudFormation');
    });

    it('should keep monitoring until stack not found error', async () => {
        const deleteStartEvent = {
            StackEvents: [
                {
                    EventId: '1a2b3c4d',
                    StackName: 'blah',
                    LogicalResourceId: 'blah',
                    ResourceType: 'AWS::CloudFormation::Stack',
                    Timestamp: new Date(),
                    ResourceStatus: 'DELETE_IN_PROGRESS'
                },
            ],
        };
        const stackNotFoundError = {
            message: 'Stack new-service-dev does not exist'
        };
        let describeStackEventsCallCount = 0;
        AWSMock.mock('CloudFormation', 'describeStackEvents', (input: DescribeStackEventsInput, callback: Function) => {
            describeStackEventsCallCount += 1;
            if (describeStackEventsCallCount <= 1) {
                callback(null, deleteStartEvent);
            } else {
                callback(null, stackNotFoundError);
            }
        });
        let monitor = new Monitor();

        await monitor.monitor('blah');
        expect(describeStackEventsCallCount).toBe(2);
        expect(monitor.stackStatus).toBe('DELETE_COMPLETE');
    });
});
