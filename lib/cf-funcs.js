const monitor = require('./monitor');

// use the given CloudFormation object if it is defined,
// otherwise grab the promisified one from aws-sdk.
// this allows for the CloudFormation object to be created as late as possible
// (and allows for dep injection for tests).
// TODO: DRY
const getCloudFormation = (givenCloudFormation) => {
  return (givenCloudFormation !== undefined) ? givenCloudFormation : require('./aws-promisify');
}

module.exports = {
  createStack: function(params, cloudFormation) {
    return getCloudFormation(cloudFormation).createStackAsync(params)
      .then(monitor);
  },
  updateStack: function(params, cloudFormation) {
    return getCloudFormation(cloudFormation).updateStackAsync(params)
      .then(monitor);
  },
  deleteStack: function(params, cloudFormation) {
    return getCloudFormation(cloudFormation).deleteStackAsync(params)
      .then(function(data) {
        data.StackName = params.StackName
        return data
      })
      .then(monitor);
  }
};
