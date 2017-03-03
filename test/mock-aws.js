var CF = require('../lib/aws-promisify');
const sinon = require('sinon');

['createStackAsync', 'updateStackAsync', 'deleteStackAsync'].forEach(function(func){
  sinon.stub(CF, func, function(params) {
    return new Promise(function(resolve, reject) {
      resolve({StackId: params.StackName});
    });
  });
});

module.exports = CF;
