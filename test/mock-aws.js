var CF = require('../lib/aws-promisify');
const sinon = require('sinon');
const ACCOUNT_ID = '123456789012';
const STACK_ID = 'abcd1234-efgh-5678-ijkl-9012mnop3456';

sinon.stub(CF, 'createStackAsync', function(params) {
  return new Promise(function(resolve, reject) {
    resolve({StackId: params.StackName});
  });
});

sinon.stub(CF, 'describeStackEventsAsync', function(params){
  return new Promise(function(resolve, reject) {
    const now = new Date();
    resolve({StackEvents:[
      {
        StackId: `arn:aws:cloudformation:us-west-2:${ACCOUNT_ID}:stack/${params.StackName}/${STACK_ID}`,
        EventId: 'd797a8c0-8d66-11e6-8349-50a686fc37d2',
        StackName: `${params.StackName}`,
        LogicalResourceId: `${params.StackName}`,
        PhysicalResourceId: `arn:aws:cloudformation:us-west-2:${ACCOUNT_ID}:stack/${params.StackName}/${STACK_ID}`,
        ResourceType: 'AWS::CloudFormation::Stack',
        Timestamp: now,
        ResourceStatus: 'UPDATE_COMPLETE'
      }, {
        StackId: `arn:aws:cloudformation:us-west-2:${ACCOUNT_ID}:stack/${params.StackName}/${STACK_ID}`,
        EventId: `${params.StackName}Bucket-CREATE_IN_PROGRESS-${now.toISOString()}`,
        StackName: `${params.StackName}`,
        LogicalResourceId: `${params.StackName}Bucket`,
        PhysicalResourceId: '',
        ResourceType: 'AWS::S3::Bucket',
        Timestamp: now,
        ResourceStatus: 'CREATE_IN_PROGRESS',
        ResourceProperties: '{}\n'
      }
    ]});
  });
});

module.exports = CF;
