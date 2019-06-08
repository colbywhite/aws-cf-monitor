import AWS from 'aws-sdk';
import * as AWSMock from 'aws-sdk-mock';
import * as winston from 'winston';
import { DELETE_IN_PROGRESS_EVENT, STACK_NOT_FOUND_ERROR } from '../test/aws.events';
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
        AWSMock.restore('CloudFormation');
    });

    it('should keep monitoring until stack not found error', async () => {
        AWSMock.mock('CloudFormation', 'describeStackEvents', returnStackEvents([DELETE_IN_PROGRESS_EVENT, STACK_NOT_FOUND_ERROR]));

        const monitor = new Monitor();
        await monitor.monitor('blah');

        expect(monitor.stackStatus).toBe('DELETE_COMPLETE');
        expect(loggerSpy).toHaveBeenCalledTimes(2);
    });
});
