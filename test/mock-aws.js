var CF = require('../lib/aws-promisify');
const sinon = require('sinon');
const ACCOUNT_ID = '123456789012';
const STACK_ID = 'abcd1234-efgh-5678-ijkl-9012mnop3456';

sinon.stub(CF, 'createStackAsync', function(params) {
  return new Promise(function(resolve, reject) {
    resolve({StackId: params.StackName});
  });
});

module.exports = CF;
