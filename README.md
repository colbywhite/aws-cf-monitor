# aws-cf-monitor
[![Build Status](https://travis-ci.org/colbywhite/aws-cf-monitor.svg?branch=master)](https://travis-ci.org/colbywhite/aws-cf-monitor)
[![npm](https://img.shields.io/npm/v/aws-cf-monitor.svg)](https://www.npmjs.com/package/aws-cf-monitor)
[![npm](https://img.shields.io/npm/dt/aws-cf-monitor.svg)](https://www.npmjs.com/package/aws-cf-monitor)
[![npm](https://img.shields.io/npm/l/aws-cf-monitor.svg)](https://www.npmjs.com/package/aws-cf-monitor)

A wrapper around the AWS CloudFormation Node API that monitors the progress of CF commands while providing smart logging.

The AWS API handles CloudFormation commands asynchronously, meaning you make a request to create a stack and you then write a bunch of boilerplate code to poll and wait for the creation to finish.

This aims to replace that boilerplate code with some pretty `winston` logging so you can watch the events as they come.

# Usage

```javascript
import AWS from 'aws-sdk';
import { LOG_NAME, Monitor } from 'aws-cf-monitor';
import winston from 'winston';

const input = {StackName: 'blah', TemplateBody: 'template goes here'};
const cf = new AWS.CloudFormation();

// simplest log configuration
winston.loggers.add(LOG_NAME, {
    format: winston.format.simple(),
    transports: [new winston.transports.Console()]
});

cf.createStack(input).promise()
    .then(() => new Monitor().monitor(name, cf))
    .then((status) => {
      console.log(`Hooray, the stack is ${status}`);
      console.log('And I didn\'t have to write a bunch of boilerplate to wait for it!');
    });
```

## Delay Interval
As the `CFMonitor` waits for your stack to complete, it will poll for the status.
The interval in between polls can be controlled via the `AWS_CF_MONITOR_DELAY` environment variable.
The default is _5000 milliseconds_.

## Configure logger
You can configure the logger by whichever means you prefer to configure a `winston` logger.
The name of the logger is `aws-cf-monitor`, which is a constant saved in `LOG_NAME`.

See the [winston](https://github.com/winstonjs/winston) project for more information.

# Inspiration
The way the `[serverless framework](https://github.com/serverless/serverless)` handles these CloudFormation requests is the inspiration.
The framework handles polling well and prints some pretty color-coded logging as well, making it easy to follow the progress of the stack.

The bulk of that original logic is in the [monitorStack.js](https://github.com/serverless/serverless/blob/c13b81a9f2a2f3ed05f0775cda2275338cc0ccbd/lib/plugins/aws/lib/monitorStack.js).
