var CF = require('../lib/aws-promisify');
const sinon = require('sinon');

sinon.stub(CF, 'createStackAsync', function(params) {
  return new Promise(function(resolve, reject) {
    resolve({StackId: params.StackName});
  });
});

module.exports = CF;
