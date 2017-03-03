# aws-cf-monitor
[![Build Status](https://travis-ci.org/colbywhite/aws-cf-monitor.svg?branch=master)](https://travis-ci.org/colbywhite/aws-cf-monitor)

A wrapper around the AWS CloudFormation Node API that monitors the progress of the CF commands while providing smart logging.

The AWS API handles CloudFormation commands asynchronously, meaning you make a request to create a stack and you then write a bunch of boilerplate code to poll and wait for the creation to finish.

This aims to replace that boilerplate code with some pretty `winston` logging so you can watch the events as they come.

# Usage

```
const AWSCFMonitor = require('aws-cf-monitor');

// use the same params that the AWS.CloudFormation object normally takes
const params = {}

# updateStack and deleteStack are also supported
AWSCFMonitor.createStack(params)
  .then(function(finalStatus) {
    console.log(`Hooray, the stack is ${finalStatus}`);
    console.log('And I didn\'t have to write a bunch of boilerplate to wait for it!');
  });
```

## Delay Interval
As the `CFMonitor` waits for your stack to complete, it will poll for the status.
The interval in between polls can be controlled via the `AWS_CF_MONITOR_DELAY` environment variable.
The default is _5000 milliseconds_.

## Configure logger
You can configure the logger by whichever means you prefer to configure a `winston` logger.
The name of the logger is `aws-cf-monitor`, which is a constant saved in `AWSCFMonitor.LOG_NAME`.
If no logger is configured, a logger with the default `winston` configuration is used.

See the [winston](https://github.com/winstonjs/winston) project for more information.

```
// One example for configuring the logger
const winston = require('winston');
const AWSCFMonitor = require('aws-cf-monitor');

winston.loggers.add(AWSCFMonitor.LOG_NAME, {
  file: {
    level: 'info',
    filename: 'cf.log'
  }
});
var logger = winston.loggers.get(AWSCFMonitor.LOG_NAME);
logger.remove(winston.transports.Console);
```

# Tests

`npm test`

#Inspiration
The way the `[serverless framework](https://github.com/serverless/serverless)` handles these CloudFormation requests is the inspiration.
The framework handles polling well and prints some pretty color-coded logging as well, making it easy to follow the progress of the stack.

The bulk of that original logic is in the[monitorStack.js](https://github.com/serverless/serverless/blob/c13b81a9f2a2f3ed05f0775cda2275338cc0ccbd/lib/plugins/aws/lib/monitorStack.js).
