var Db = require('../');
var assert = require('assert');
var _ = require('underscore');
var Backbone = require('backbone');

describe('Model', function() {
  describe('#fetch', function(t) {
    it('should .find from store', function(t) {
      var m = new Backbone.Model({id:1});
      Backbone.sync = Db.sync;
      m.db = new Db("model");
      m.fetch({success: function() {
        // id:1 is non existing
      }, error: function() {
        // so we get error
        t();
      }});
    });
    it('should include all the variables', function(t) {
      var m = new Backbone.Model({id:1});
      m.save({variable:"123"},{success: function() {
        var m2 = new Backbone.Model({id:1});
        m2.fetch({success: function() {
          console.log(m2);
          assert.equal(m2.get("variable"),"123");
          t();
        }, error: function(err) {
          console.error(err);
          assert.ok(false);
        }});
      }});
    });
  });
});