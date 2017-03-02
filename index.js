const createStack = require('./lib/create-stack');
const constants = require('./lib/constants');

module.exports = {
  createStack: createStack,
  LOG_NAME: constants.LOG_NAME
};
