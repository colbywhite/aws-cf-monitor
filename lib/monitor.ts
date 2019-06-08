import AWS from 'aws-sdk';
import CloudFormation, {
    DescribeStackEventsInput,
    DescribeStackEventsOutput,
    ResourceStatus,
    StackEvent
} from 'aws-sdk/clients/cloudformation';
import chalk from 'chalk';
import winston, { Logger } from 'winston';
import { DEFAULT_DELAY, LOG_NAME } from './constants';

const COMPLETE_STATUSES = [
    'CREATE_COMPLETE',
    'UPDATE_COMPLETE',
    'DELETE_COMPLETE',
];

export class Monitor {
    private readonly delayInMs: number;
    private readonly monitorStart: Date;
    private processedEvents: any[];
    private _stackStatus: any;
    private firstError: any;

    public constructor() {
        this.delayInMs = Number(process.env.AWS_CF_MONITOR_DELAY) || DEFAULT_DELAY;
        this.processedEvents = [];
        this.monitorStart = new Date();
        this.monitorStart.setSeconds(this.monitorStart.getSeconds() - this.delayInMs / 1000);
        this._stackStatus = undefined;
        this.firstError = undefined;
    }

    public get stackStatus(): any {
        return this._stackStatus;
    }

    private static get logger(): Logger {
        return winston.loggers.get(LOG_NAME);
    }

    public async monitor(stackName: string, cloudFormation: CloudFormation = new AWS.CloudFormation()) {
        while (COMPLETE_STATUSES.indexOf(this._stackStatus) === -1) {
            await this.queryAndLogEvents(stackName, cloudFormation);
            await new Promise(resolve => setTimeout(resolve, this.delayInMs));
        }
        Monitor.logger.info(`Stack finished with ${this._stackStatus}`);
    }


    private queryAndLogEvents(stackName: string, cloudFormation: CloudFormation): Promise<void> {
        const params: DescribeStackEventsInput = {StackName: stackName};
        return cloudFormation.describeStackEvents(params).promise()
            .then((data: DescribeStackEventsOutput) => {
                if (!data.StackEvents) {
                    throw data;
                }
                data.StackEvents.reverse().forEach(this.processStackEvent.bind(this));
                if (this.firstError || (this._stackStatus && this._stackStatus.endsWith('ROLLBACK_COMPLETE'))) {
                    const errorMessage = `${this.firstError.LogicalResourceId} - ${this.firstError.ResourceStatusReason}`;
                    Monitor.logger.error(`Deployment failed! ${errorMessage}`);
                    const err = {message: errorMessage, event: this.firstError};
                    throw err;
                }
            }).catch((err: any) => {
                if (err.message.endsWith('does not exist')) {
                    this._stackStatus = 'DELETE_COMPLETE';
                    return Promise.resolve();
                } else {
                    return Promise.reject(err);
                }
            });
    }

    private processStackEvent(stackEvent: StackEvent): void {
        const eventInRange = this.monitorStart < stackEvent.Timestamp;
        const eventNotLogged = this.processedEvents.indexOf(stackEvent.EventId) === -1;
        const eventStatus = stackEvent.ResourceStatus || undefined;
        if (eventInRange && eventNotLogged) {
            // Since this is an event on the stack, keep track of stack status
            if (stackEvent.ResourceType === 'AWS::CloudFormation::Stack'
                && stackEvent.StackName === stackEvent.LogicalResourceId) {
                this._stackStatus = eventStatus;
            }
            // Keep track of first failed event
            if (eventStatus && eventStatus.endsWith('FAILED') && !this.firstError) {
                this.firstError = stackEvent;
            }
            Monitor.logEvent(stackEvent);
            // keep track of processed events so when we start looping,
            // we can ignore them subsequent iterations
            this.processedEvents.push(stackEvent.EventId);
        }
    }

    private static logEvent(stackEvent: StackEvent): void {
        const status: string = Monitor.getColoredStatusString(stackEvent.ResourceStatus);
        let logString = `CloudFormation - ${status} - `;
        logString += `${stackEvent.ResourceType} - ${stackEvent.LogicalResourceId}`;
        if (status && status.endsWith('FAILED')) {
            Monitor.logger.error(logString);
        } else {
            Monitor.logger.info(logString);
        }
    }

    private static getColoredStatusString(status: ResourceStatus | undefined): string {
        if (!status) {
            return '';
        } else if (status.endsWith('FAILED')) {
            return chalk.red(status);
        } else if (status.endsWith('PROGRESS')) {
            return chalk.yellow(status);
        } else if (status.endsWith('COMPLETE')) {
            return chalk.green(status);
        } else {
            return status;
        }
    }

}
