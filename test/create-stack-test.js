const assert = require('assert');
const createStackFactory = require('../lib/create-stack')

describe('#create-stack', function(){
  var msgs = [];
  var createStack;

  before(function() {
    const logger = {
      debug: function(msg) {
        msgs.push(msg);
      },
      info: function(msg) {
        msgs.push(msg);
      }
    };
    const mockAwsCreateStack = function(params, callback) {
      callback(null, {success: true});
    };
    createStack = createStackFactory({createStack: mockAwsCreateStack}, logger);
  });

  beforeEach(function() {
    msgs.length = 0;
  })

  it('should log', function() {
    return createStack({StackName: 1})
      .then(function(){
        assert.equal(3, msgs.length);
      });
  })
});
