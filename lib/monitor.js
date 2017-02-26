// TODO: restructure this module to feel better
const Monitor = {
  init: function(logger){
    this.logger = logger;
  },
  monitor: function(cfData, logger) {
    this.logger.info(`Monitoring the stack ${cfData.StackId}`);
  }
};

module.exports = Monitor;
