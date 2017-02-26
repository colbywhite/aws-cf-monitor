const AWS = require('aws-sdk');
const Monitor = require('./monitor');

function createStackPromise(cloudformation, logger, params) {
  return new Promise(function(resolve, reject){
    logger.debug(`Creating stack ${params.StackName}`);
    cloudformation.createStack(params, function(err, data) {
      if (err) { reject(err); }
      logger.info(`Created stack ${params.StackName}`);
      resolve(data);
    });
  });
};

function createStack(cloudformation, logger, params) {
  return createStackPromise(cloudformation, logger, params)
    .then(function(data){
      const cfMonitor = Monitor(logger);
      cfMonitor.monitor(data);
    });
};

const createStackFactory = function(cloudformation, logger) {
  return createStack.bind(null, cloudformation, logger);
}

module.exports = createStackFactory;
