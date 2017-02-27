const CF = require('./aws-promisify');
const chalk = require('chalk');

const Monitor = function(logger) {
  var processedEvents = [];
  var monitoredSince = new Date();
  var stackStatus = null;
  var firstError = null;

  const queryAndLogEvents = function(stackId) {
    const params = { StackName: stackId };
    return CF.describeStackEventsAsync(params)
        .then(function(data){
          data.StackEvents.reverse().forEach(logEvent);
        });
  };

  const logEvent = function(stackEvent) {
    // Log stack events
    var logLevel = logger.info;
    var statusLogString = stackEvent.ResourceStatus || null;
    if (statusLogString && statusLogString.endsWith('FAILED')) {
      statusLogString = chalk.red(statusLogString);
      logLevel = logger.error;
    } else if (statusLogString && statusLogString.endsWith('PROGRESS')) {
      statusLogString = chalk.yellow(statusLogString);
    } else if (statusLogString && statusLogString.endsWith('COMPLETE')) {
      statusLogString = chalk.green(statusLogString);
    }
    var logString = `CloudFormation - ${statusLogString} - `;
    logString += `${stackEvent.ResourceType} - `;
    logString += `${stackEvent.LogicalResourceId}`;
    logLevel(logString);
  }

  const processStackEvent = function(stackEvent) {
    const eventInRange = (monitoredSince < stackEvent.Timestamp);
    const eventNotLogged = (loggedEvents.indexOf(stackEvent.EventId) === -1);
    const eventStatus = stackEvent.ResourceStatus || null;
    if (eventInRange && eventNotLogged) {
      // Since this is an event on the stack, keep track of stack status
      if (stackEvent.ResourceType === 'AWS::CloudFormation::Stack'
        && stackEvent.StackName === stackEvent.LogicalResourceId) {
        stackStatus = eventStatus;
      }
      // Keep track of first failed event
      if (eventStatus
        && eventStatus.endsWith('FAILED') && firstError === null) {
        firstError = stackEvent;
      }
      logEvent(stackEvent);
      // keep track of processed events so when we start looping,
      // we can ignore them subsequent iterations
      processedEvents.push(stackEvent.EventId);
    }
  };

  return {
    monitor: function(cfData) {
      logger.info(`Monitoring the stack ${cfData.StackId}`);
      return queryAndLogEvents(cfData.StackId);
    }
  }
};

module.exports = Monitor;
