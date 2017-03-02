const CF = require('./aws-promisify');
const monitor = require('./monitor');

function createStack(params) {
  return CF.createStackAsync(params)
    .then(monitor);
};

module.exports = createStack;
