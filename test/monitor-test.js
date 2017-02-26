const assert = require('assert');
const Monitor = require('../lib/monitor');
const spylogger = require('./spy-logger');

describe('Monitor#monitor', function(){
  var cfMonitor;

  beforeEach(function() {
    cfMonitor = Monitor(spylogger.logger);
    spylogger.spy.reset();
  })

  it('should log', function() {
    cfMonitor.monitor({StackId: 1}, spylogger.logger);
    assert.ok(spylogger.spy.calledOnce);
  });
});
