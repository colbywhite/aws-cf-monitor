const winston = require('winston');
const createStackFactory = require('./lib/create-stack');
const constants = require('./lib/constants');

const CFMonitor = function(){
  return {
    createStack: createStackFactory(),
    LOG_NAME: constants.LOG_NAME
  };
}();

module.exports = CFMonitor;
