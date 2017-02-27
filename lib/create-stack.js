const CF = require('./aws-promisify');
const Monitor = require('./monitor');

function createStack(logger, params) {
  return CF.createStackAsync(params)
    .then(function(data){
      const cfMonitor = Monitor(logger);
      cfMonitor.monitor(data);
    });
};

const createStackFactory = function(logger) {
  return createStack.bind(null, logger);
}

module.exports = createStackFactory;
