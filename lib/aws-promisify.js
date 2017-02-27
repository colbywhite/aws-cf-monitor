const BbPromise = require('bluebird');
const AWS = require('aws-sdk');
module.exports = BbPromise.promisifyAll(new AWS.CloudFormation());
