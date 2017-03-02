const winston = require('winston');
const sinon = require('sinon');
const spyLogger = require('winston-spy');
const constants = require('../lib/constants');

const spy = sinon.spy();
var logger = winston.loggers.get(constants.LOG_NAME);

logger.remove(winston.transports.Console);
logger.add(winston.transports.SpyLogger, { spy: spy });

module.exports = spy;
