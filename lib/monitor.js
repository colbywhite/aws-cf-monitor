const winston = require('winston');
const constants = require('./constants');
const chalk = require('chalk');
const Promise = require('bluebird');

const completeStatuses = [
  'CREATE_COMPLETE',
  'UPDATE_COMPLETE',
  'DELETE_COMPLETE',
];

// a promise-based while loop
const promiseWhile = function(conditionFunc, actionPromiseFunc, delayInMs) {
    const resolver = Promise.defer();
    const loop = function(result) {
        if (!conditionFunc()) return resolver.resolve(result);
        return Promise.delay(delayInMs)
            .then(actionPromiseFunc)
            .then(loop)
            .catch(function(err) {
              return resolver.reject(err)
            });
    };
    process.nextTick(loop);
    return resolver.promise;
};

// use the given CloudFormation object if it is defined,
// otherwise grab the promisified one from aws-sdk.
// this allows for the CloudFormation object to be created as late as possible
// (and allows for dep injection for tests).
// TODO: DRY
const getCloudFormation = (givenCloudFormation) => {
  return (givenCloudFormation !== undefined) ? givenCloudFormation : require('./aws-promisify');
}

const monitor = function(cfData, cloudFormation) {
  const delayInMs = Number(process.env.AWS_CF_MONITOR_DELAY) || constants.DEFAULT_DELAY;
  var processedEvents = [];
  var monitoredSince = new Date();
  monitoredSince.setSeconds(monitoredSince.getSeconds() - delayInMs/1000);
  var stackStatus = null;
  var firstError = null;

  const logger = function() {
    return winston.loggers.get(constants.LOG_NAME);
  }

  const queryAndLogEvents = function(stackName, cloudFormation) {
    const params = { StackName: stackName };
    return getCloudFormation(cloudFormation).describeStackEventsAsync(params)
        .then(function(data){
          if(!data.StackEvents) {
            throw data;
          }
          data.StackEvents.reverse().forEach(processStackEvent);
          if (firstError || (stackStatus && stackStatus.endsWith('ROLLBACK_COMPLETE'))) {
            const errorMessage = `${firstError.LogicalResourceId} - ${firstError.ResourceStatusReason}`
            logger().error(`Deployment failed! ${errorMessage}`);
            const err = {message: errorMessage, event: firstError}
            throw err;
          }
          return stackStatus;
        }).catch(function(err) {
          if(err.message.endsWith('does not exist')) {
            stackStatus = 'DELETE_COMPLETE';
            return Promise.resolve(stackStatus);
          }
          else {
            return Promise.reject(err);
          }
        });
  };

  const logEvent = function(stackEvent) {
    // Log stack events
    var logLevel = logger().info;
    var statusLogString = stackEvent.ResourceStatus || null;
    if (statusLogString && statusLogString.endsWith('FAILED')) {
      statusLogString = chalk.red(statusLogString);
      logLevel = logger().error;
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
    const eventNotLogged = (processedEvents.indexOf(stackEvent.EventId) === -1);
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

  const isStatusIncomplete = function() {
    return completeStatuses.indexOf(stackStatus) === -1;
  }

  const name = cfData.StackId || cfData.StackName;
  logger().info(`Monitoring the stack ${name}`);
  const stackQuery = queryAndLogEvents.bind(this, name, cloudFormation);
  return promiseWhile(isStatusIncomplete, stackQuery, delayInMs)
    .then(function(finalStatus) {
      logger().info(`Stack finished with ${finalStatus}`);
      return finalStatus;
    });
};

module.exports = monitor;
