const CF = require('./aws-promisify');
const Monitor = require('./monitor');

function createStack(logger, params) {
  const cfMonitor = Monitor(logger);
  return CF.createStackAsync(params)
    .then(cfMonitor.monitor);
};

const createStackFactory = function(logger) {
  return createStack.bind(null, logger);
}

module.exports = createStackFactory;
