import { AWSError } from 'aws-sdk';
import { DescribeStackEventsOutput } from 'aws-sdk/clients/cloudformation';

export const DELETE_IN_PROGRESS_EVENT: DescribeStackEventsOutput = {
    StackEvents: [
        {
            StackId: 'StackId',
            EventId: 'EventId',
            StackName: 'StackName',
            LogicalResourceId: 'LogicalResourceId',
            ResourceType: 'AWS::CloudFormation::Stack',
            Timestamp: new Date(),
            ResourceStatus: 'DELETE_IN_PROGRESS'
        }
    ]
};

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
