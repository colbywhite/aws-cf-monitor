import { AWSError } from 'aws-sdk';
import { DescribeStackEventsInput, DescribeStackEventsOutput } from 'aws-sdk/clients/cloudformation';

export function returnStackEvents(events: Array<DescribeStackEventsOutput | AWSError>) {
    let count = 0;
    return (input: DescribeStackEventsInput, callback: Function) => {
        callback(null, events[count++]);
    }
}
