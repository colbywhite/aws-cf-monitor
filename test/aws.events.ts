import { AWSError } from 'aws-sdk';
import { DescribeStackEventsOutput, ResourceStatus } from 'aws-sdk/clients/cloudformation';
import faker from 'faker';

export const STACK_DELETE_IN_PROGRESS_EVENT: DescribeStackEventsOutput = buildStackEvent('DELETE_IN_PROGRESS');

export const STACK_UPDATE_IN_PROGRESS: DescribeStackEventsOutput = buildStackEvent('UPDATE_IN_PROGRESS');

export const STACK_ROLLBACK_IN_PROGRESS_EVENT: DescribeStackEventsOutput = buildStackEvent('UPDATE_ROLLBACK_IN_PROGRESS');

export const STACK_ROLLBACK_FAILED_EVENT: DescribeStackEventsOutput = buildStackEvent('UPDATE_ROLLBACK_FAILED');

export const STACK_UPDATE_COMPLETE: DescribeStackEventsOutput = buildStackEvent('UPDATE_COMPLETE');

export const STACK_NOT_FOUND_ERROR: AWSError = {
    cfId: 'cfId',
    code: 'code',
    extendedRequestId: 'extendedRequestId',
    hostname: 'hostname',
    name: 'name',
    region: 'region',
    requestId: 'requestId',
    retryDelay: 0,
    retryable: false,
    stack: 'stack',
    statusCode: 0,
    time: new Date(),
    message: 'Stack new-service-dev does not exist'
};

export const BUCKET_EVENT: DescribeStackEventsOutput = {
    StackEvents: [
        {
            StackId: 'StackId',
            EventId: faker.random.uuid(),
            StackName: 'StackName',
            LogicalResourceId: 'BucketName',
            ResourceType: 'AWS::S3::Bucket',
            Timestamp: new Date()
        },
    ],
};

export const BUCKET_FAILED_EVENT: DescribeStackEventsOutput = {
    StackEvents: [
        {
            StackId: 'StackId',
            EventId: faker.random.uuid(),
            StackName: 'StackName',
            LogicalResourceId: 'BucketName',
            ResourceType: 'AWS::S3::Bucket',
            Timestamp: new Date(),
            ResourceStatus: 'CREATE_FAILED',
            ResourceStatusReason: 'Bucket already exists'
        },
    ],
};

function buildStackEvent(status: ResourceStatus): DescribeStackEventsOutput {
    return {
        StackEvents: [
            {
                StackId: 'StackId',
                EventId: faker.random.uuid(),
                StackName: 'StackName',
                LogicalResourceId: 'StackName',
                ResourceType: 'AWS::CloudFormation::Stack',
                Timestamp: new Date(),
                ResourceStatus: status
            },
        ],
    }
}
