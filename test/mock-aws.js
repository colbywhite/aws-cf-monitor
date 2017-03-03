var CF = require('../lib/aws-promisify');
const sinon = require('sinon');

['createStackAsync', 'updateStackAsync'].forEach(function(func){
  sinon.stub(CF, func, function(params) {
    return new Promise(function(resolve, reject) {
      resolve({StackId: params.StackName});
    });
  });
});

sinon.stub(CF, 'deleteStackAsync', function(params) {
  return new Promise(function(resolve, reject) {
    resolve({});
  });
});

module.exports = CF;
