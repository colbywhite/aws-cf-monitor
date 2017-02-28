# cf-monitor
A wrapper around the AWS CloudFormation Node API that monitors the progress of the CF commands while providing smart logging.

The AWS API handles CloudFormation commands asynchronously, meaning you make a request to create a stack and you then write a bunch of boilerplate code to poll and wait for the creation to finish.

This aims to replace that boilerplate code with some pretty `winston` logging so you can watch the events as they come.

## Inspiration
The way the `[serverless framework](https://github.com/serverless/serverless)` handles these CloudFormation requests is the inspiration.
The framework handles polling well and prints some pretty color-coded logging as well, making it easy to follow the progress of the stack.

The bulk of that original logic is in the[monitorStack.js](https://github.com/serverless/serverless/blob/c13b81a9f2a2f3ed05f0775cda2275338cc0ccbd/lib/plugins/aws/lib/monitorStack.js).

# Tests

`npm test`
