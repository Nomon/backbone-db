var Db = require('../');
var assert = require('assert');
var _ = require('underscore');
var Backbone = require('backbone');

var db = new Db("asdasdasdasdsa");
var MyModel = Backbone.Model.extend({
  url: function() {
    if(this.isNew())
      return "mymodel";
    return "mymodel:"+this.get(this.idAttribute);
  },
  db: db,
  sync: Db.sync
});
Backbone.sync = Db.sync;

describe('Model', function() {
  describe('#fetch', function(t) {
    it('should .find from store', function(t) {
      var m = new MyModel({id:1});
      m.fetch({success: function() {
        // id:1 is non existing
      }, error: function() {
        // so we get error
        t();
      }});
    });
    it('should include all the variables', function(t) {
      var m = new MyModel({id:1});
      m.save({variable:"123"},{success: function() {
        var m2 = new MyModel({id:1});
        m2.fetch({success: function() {
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