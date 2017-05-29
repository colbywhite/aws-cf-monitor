const BbPromise = require('bluebird');
const AWS = require('aws-sdk');
module.exports = (givenCloudFormation) => {
  return (givenCloudFormation !== undefined) ? givenCloudFormation : BbPromise.promisifyAll(new AWS.CloudFormation());
}
