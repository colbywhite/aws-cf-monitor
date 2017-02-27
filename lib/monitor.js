const CF = require('./aws-promisify');

const Monitor = function(logger) {
  var loggedEvents = [];
  var monitoredSince = new Date();
  var stackStatus = null;
  var stackLatestError = null;

  const queryAndLogEvents = function(stackId) {
    const params = { StackName: stackId };
    return CF.describeStackEventsAsync(params)
        .then(function(data){
          data.StackEvents.reverse().forEach(logger.info);
        });
  };
  return {
    monitor: function(cfData) {
      logger.info(`Monitoring the stack ${cfData.StackId}`);
      return queryAndLogEvents(cfData.StackId);
    }
  }
};

module.exports = Monitor;
