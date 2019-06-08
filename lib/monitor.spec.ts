import AWS from 'aws-sdk';
import * as AWSMock from 'aws-sdk-mock';
import * as winston from 'winston';
import {
    BUCKET_EVENT,
    DELETE_IN_PROGRESS_EVENT,
    STACK_NOT_FOUND_ERROR,
    STACK_UPDATE_COMPLETE,
    STACK_UPDATE_IN_PROGRESS
} from '../test/aws.events';
import { returnStackEvents } from '../test/aws.mocks';
import { SpyTransport } from '../test/spy-transport';
import { LOG_NAME } from './constants';
import { Monitor } from './monitor';

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
        AWSMock.mock('CloudFormation', 'describeStackEvents', returnStackEvents([DELETE_IN_PROGRESS_EVENT, STACK_NOT_FOUND_ERROR]));

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
});
