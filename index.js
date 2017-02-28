const winston = require('winston');
const createStackFactory = require('./lib/create-stack');

const LOG_NAME = 'cf-monitor';

const CFMonitor = function(){
  const logger = winston.loggers.get(LOG_NAME);
  return {
    createStack: createStackFactory(logger),
    LOG_NAME: LOG_NAME
  };
}();

module.exports = CFMonitor;
