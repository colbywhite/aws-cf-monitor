import AWS from 'aws-sdk';
import * as AWSMock from 'aws-sdk-mock';
import { DescribeStackEventsOutput } from "aws-sdk/clients/cloudformation";
import * as winston from 'winston';
import {
    BUCKET_EVENT,
    BUCKET_FAILED_EVENT,
    buildStackEvent,
    STACK_DELETE_IN_PROGRESS_EVENT,
    STACK_NOT_FOUND_ERROR,
    STACK_ROLLBACK_FAILED_EVENT,
    STACK_ROLLBACK_IN_PROGRESS_EVENT,
    STACK_UPDATE_COMPLETE,
    STACK_UPDATE_IN_PROGRESS
} from '../test/aws.events';
import { returnStackEvents } from '../test/aws.mocks';
import { SpyTransport } from '../test/spy-transport';
import { LOG_NAME } from './constants';
import { COMPLETE_STATUSES, Monitor } from './monitor';

describe('Monitor', () => {
    let loggerSpy: jasmine.Spy;

    beforeEach(() => {
        process.env.AWS_CF_MONITOR_DELAY = '1';
        loggerSpy = jasmine.createSpy('logger');
        AWSMock.setSDKInstance(AWS);
        winston.loggers.add(LOG_NAME, {
            transports: [new SpyTransport({}, loggerSpy)]
        });
    });

    afterEach(() => {
        AWSMock.restore();
        winston.loggers.close(LOG_NAME);
    });

    it('should keep monitoring until stack not found error', async () => {
        AWSMock.mock('CloudFormation', 'describeStackEvents', returnStackEvents([STACK_DELETE_IN_PROGRESS_EVENT, STACK_NOT_FOUND_ERROR]));

        const monitor = new Monitor();
        await monitor.monitor('blah');

        expect(monitor.stackStatus).toBe('DELETE_COMPLETE');
        // 1 INFO at the beginning, then 1 for each real event
        expect(loggerSpy).toHaveBeenCalledTimes(3);
    });

    it('should keep monitoring when 1st event is not "AWS::CloudFormation::Stack"', async() => {
        AWSMock.mock('CloudFormation', 'describeStackEvents', returnStackEvents([BUCKET_EVENT, STACK_UPDATE_IN_PROGRESS, STACK_UPDATE_COMPLETE]));

        const monitor = new Monitor();
        await monitor.monitor('blah');

        expect(monitor.stackStatus).toEqual('UPDATE_COMPLETE');
        // 1 INFO at the beginning and the end, then 1 for each real event
        expect(loggerSpy).toHaveBeenCalledTimes(5);
    });

    it('should throw an error and exit immediately if stack status *_FAILED', async () => {
        AWSMock.mock('CloudFormation', 'describeStackEvents', returnStackEvents([STACK_UPDATE_IN_PROGRESS, BUCKET_FAILED_EVENT, STACK_ROLLBACK_IN_PROGRESS_EVENT, STACK_ROLLBACK_FAILED_EVENT]));

        const monitor = new Monitor();
        try {
            await monitor.monitor('blah');
            fail('Monitor should have thrown an error');
        } catch (err) {
            // 1 INFO at the beginning then 1 for each event until the failure
            // the 1 ERROR for the final failure
            expect(loggerSpy).toHaveBeenCalledTimes(4);
        }
    });

    COMPLETE_STATUSES.forEach((status: string) => {
        const action = status.split('_')[0];

        it(`should keep monitoring until ${status} stack status`, async () => {
            const inProgressEvent: DescribeStackEventsOutput = buildStackEvent(`${action}_IN_PROGRESS`);
            const completedEvent: DescribeStackEventsOutput = buildStackEvent(status);
            AWSMock.mock('CloudFormation', 'describeStackEvents', returnStackEvents([inProgressEvent, completedEvent]));

            const monitor = new Monitor();
            await monitor.monitor('blah');

            expect(monitor.stackStatus).toEqual(status);
            // 1 INFO at the beginning and the end, then 1 for each event
            expect(loggerSpy).toHaveBeenCalledTimes(4);
        });

        it(`should not stop monitoring on ${status} nested stack status`, async () => {
            const inProgressEvent: DescribeStackEventsOutput = buildStackEvent(`${action}_IN_PROGRESS`);
            const nestedStackEvent: DescribeStackEventsOutput = buildStackEvent(status, 'nestedStack');
            const completedEvent: DescribeStackEventsOutput = buildStackEvent(status);
            AWSMock.mock('CloudFormation', 'describeStackEvents', returnStackEvents([inProgressEvent, nestedStackEvent, completedEvent]));

            const monitor = new Monitor();
            await monitor.monitor('blah');

            expect(monitor.stackStatus).toEqual(status);
            // 1 INFO at the beginning and the end, then 1 for each event
            expect(loggerSpy).toHaveBeenCalledTimes(5);
        });
    });
});
