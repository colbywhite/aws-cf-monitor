const CF = require('./aws-promisify');
const Monitor = require('./monitor');

function createStack(logger, delayInMs, params) {
  const cfMonitor = Monitor(logger, delayInMs);
  return CF.createStackAsync(params)
    .then(cfMonitor.monitor);
};

const createStackFactory = function(logger, delayInMs) {
  return createStack.bind(null, logger, delayInMs);
}

module.exports = createStackFactory;
