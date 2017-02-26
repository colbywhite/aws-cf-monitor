const assert = require('assert');
const monitorStack = require('../lib/monitor');
const spylogger = require('./spy-logger');

describe('#monitorStack', function(){
  beforeEach(function() {
    spylogger.spy.reset();
  })

  it('should log', function() {
    monitorStack({StackId: 1}, spylogger.logger);
    assert.ok(spylogger.spy.calledOnce);
  });
});
