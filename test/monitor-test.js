const assert = require('assert');
const monitorStack = require('../lib/monitor')

describe('#monitorStack', function(){
    it('should log', function() {
      var msgs = [];
      const logger = {
        debug: function(msg) {
          msgs.push(msg);
        },
        info: function(msg) {
          msgs.push(msg);
        }
      };
      monitorStack({StackId: 1}, logger);
      assert.equal(1, msgs.length);
    })
});
