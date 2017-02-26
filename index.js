
const AWS = require('aws-sdk');
const Logger = require('js-logger');
const createStackFactory = require('./lib/create-stack');

const CFSyncMonitor = function(){
  const cloudformation = new AWS.CloudFormation();
  const logger = Logger.get('CFSyncMonitor');
  return {
    createStack: createStackFactory(cloudformation, logger)
  }
}();

module.exports = CFSyncMonitor;
