const monitor = require('./monitor');
const getCloudFormation = require('./aws-promisify');

module.exports = {
  createStack: function(params, cloudFormation) {
    const cf = getCloudFormation(cloudFormation);
    return cf.createStackAsync(params)
      .then(function(data) {
        return monitor(data, cf)
      });
  },
  updateStack: function(params, cloudFormation) {
    const cf = getCloudFormation(cloudFormation);
    return cf.updateStackAsync(params)
      .then(function(data) {
        return monitor(data, cf)
      });
  },
  deleteStack: function(params, cloudFormation) {
    const cf = getCloudFormation(cloudFormation);
    return cf.deleteStackAsync(params)
      .then(function(data) {
        data.StackName = params.StackName
        return data
      })
      .then(function(data) {
        return monitor(data, cf)
      });
  }
};
