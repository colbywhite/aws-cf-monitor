const sinon = require('sinon');
const getCloudFormation = require('../lib/aws-promisify');

var mockCloudFormation = getCloudFormation();

['createStackAsync', 'updateStackAsync'].forEach(function(func){
  sinon.stub(mockCloudFormation, func, function(params) {
    return new Promise(function(resolve, reject) {
      resolve({StackId: params.StackName});
    });
  });
});

sinon.stub(mockCloudFormation, 'deleteStackAsync', function(params) {
  return new Promise(function(resolve, reject) {
    resolve({});
  });
});

module.exports = mockCloudFormation;
