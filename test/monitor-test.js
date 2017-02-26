const assert = require('assert');
const Monitor = require('../lib/monitor');
const spylogger = require('./spy-logger');

describe('Monitor#monitor', function(){
  beforeEach(function() {
    Monitor.init(spylogger.logger);
    spylogger.spy.reset();
  })

  it('should log', function() {
    Monitor.monitor({StackId: 1}, spylogger.logger);
    assert.ok(spylogger.spy.calledOnce);
  });
});
