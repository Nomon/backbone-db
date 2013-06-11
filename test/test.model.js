var Db = require('../');
var assert = require('assert');
var _ = require('underscore');
var Backbone = require('backbone');

describe('.sync()', function() {
  describe('when read should find from store', function(t) {
    var m = new Backbone.Model({id:1});
    m.sync = Db.sync;
    m.save(null, {success: function() {

    }});
  });
});