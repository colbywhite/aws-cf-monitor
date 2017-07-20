const monitor = require('./monitor');
const getCloudFormation = require('./aws-promisify');

function create(params, cloudFormation) {
  const cf = getCloudFormation(cloudFormation);
  return cf.createStackAsync(params)
    .then(function(data) {
      return monitor(data, cf)
    });
}

function update(params, cloudFormation) {
  const cf = getCloudFormation(cloudFormation);
  return cf.updateStackAsync(params)
    .then(function(data) {
      return monitor(data, cf)
    });
}

module.exports = {
  createStack: create,
  updateStack: update,
  createOrUpdateStack: function(params, cloudFormation) {
    return create(params, cloudFormation)
      .catch(function(error) {
        if(error.cause && error.cause.code === 'AlreadyExistsException') {
          return update(params, cloudFormation)
        }
        return Promise.reject(error)
      })

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
