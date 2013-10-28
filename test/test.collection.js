var Db = require('../');
var assert = require('assert');
var _ = require('underscore');
var Backbone = require('backbone');

var db = new Db("test");
var MyModel = Backbone.Model.extend({
  url: function() {
    if(this.isNew())
      return "mymodel";
    return "mymodel:"+this.get(this.idAttribute);
  },
  db: db,
  sync: Db.sync
});

var MyCollection = Backbone.Collection.extend({
  model: MyModel,
  url: function() {
      return "mycollection";
  },
  db: db,
  sync: Db.sync
});

Backbone.sync = Db.sync;

describe('#Collection', function() {
  describe('#fetch', function(t) {
    it('should .find from store', function(t) {
      var m = new MyCollection();
      m.fetch({success: function() {
        t();
      }, error: function(err) {
       assert(err)
      }});
    });

    it('should .create from store', function(t) {
      var m = new MyCollection();
      assert(m.length === 0);
      m.create({"test":1},{success: function(model) {
        assert(model.get("test") === 1);

        m.fetch({success: function() {
          assert(m.length === 1);
          t();
        }, error: function(err){
          assert(err);
        }});

      }, error: function(err) {
        assert(err);
      }});
    });

    it('should .create 2 models', function(t) {
      var m = new MyCollection();
      assert(m.length === 0);
      m.create({test: 1}, {
        success: function(model) {
          m.create({test: 2}, {success: function(model) {
            m.fetch({success: function() {
              assert(m.length === 2);
              t();
            }, error: function(err){
              assert(err);
            }});
          },
          error: function(err) {
            assert(err);
          }
        });
      },
      error: function(err) {
        assert(err);
      }});
    });
  });
});