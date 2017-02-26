const Monitor = function(logger) {
  return {
    monitor: function(cfData) {
      logger.info(`Monitoring the stack ${cfData.StackId}`);
    }
  }
};

module.exports = Monitor;
