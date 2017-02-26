const winston = require('winston');
const sinon = require('sinon');
const spyLogger = require('winston-spy');

const spy = sinon.spy();

const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.SpyLogger)({ spy: spy })
  ]
});

module.exports = { spy: spy, logger: logger };
