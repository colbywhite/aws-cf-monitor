const CF = require('./aws-promisify');
const monitor = require('./monitor');

module.exports = {
  createStack: function(params) {
    return CF.createStackAsync(params)
      .then(monitor);
  },
  updateStack: function(params) {
    return CF.updateStackAsync(params)
      .then(monitor);
  },
  deleteStack: function(params) {
    return CF.deleteStackAsync(params)
      .then(monitor);
  }
};
