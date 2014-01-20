var Db = require('../');
var assert = require('assert');
var _ = require('lodash');
var Backbone = require('backbone');

var db = new Db("mymodel");

var MyModel = Backbone.Model.extend({
  url: function() {
    if(this.isNew())
      return "mymodel";
    return "mymodel:"+this.get(this.idAttribute);
  },
  sync: db.sync.bind(db)
});


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
      m.save({variable:"123", counter: 1}, {
        success: function() {
          var m2 = new MyModel({id:1});
          m2.fetch({
            success: function() {
              assert.equal(m2.get("variable"), "123");
              assert.equal(m2.get("counter"), 1);
              t();
            },
            error: function(err) {
              console.error(err);
              assert.ok(false);
            }
          });
        }
      });
    });

    it('should inc counter', function(t) {
      var m = new MyModel({id: 1});
      var opts = {
        inc: {
          attribute: 'counter',
          amount: 2
        },
        success: function() {
          t();
        },
        error: function() {
          console.error(err);
          assert.ok(false);
        }
      };
      m.save(null, opts);
    });

    it('should check that counter was incresed', function(t) {
      var m2 = new MyModel({id:1});
      m2.fetch({
        success: function() {
          assert.equal(m2.get("variable"), "123");
          assert.equal(m2.get("counter"), 3);
          t();
        },
        error: function(err) {
          console.error(err);
          assert.ok(false);
        }
      });
    });
  });
});
