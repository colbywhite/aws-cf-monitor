const CF = require('./aws-promisify');
const Monitor = require('./monitor');

function createStack(delayInMs, params) {
  const cfMonitor = Monitor(delayInMs);
  return CF.createStackAsync(params)
    .then(cfMonitor.monitor);
};

const createStackFactory = function(delayInMs) {
  return createStack.bind(null, delayInMs);
}

module.exports = createStackFactory;
