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
  sync: db.sync.bind(db)
});

var MyCollection = Backbone.Collection.extend({
  model: MyModel,
  url: function() {
      return "mycollection";
  },
  sync: db.sync.bind(db)
});

describe('#Collection', function() {
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
    m.create({test: 1, arr: ['foo', 'bar']}, {
      success: function(model) {
        m.create({test: 2}, {success: function(model) {
          m.fetch({success: function() {
            assert(m.length === 3);
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

  it('should fetch collection with limit', function(t) {
    var collection = new MyCollection();
    collection.fetch({
      limit: 2,
      success: function() {
        assert.equal(collection.at(0).id, 1);
        assert.equal(collection.length, 2);
        t();
      },
      error: function(err){
        assert(err);
      }
    });
  });

  it('should fetch collection with offset', function(t) {
    var collection = new MyCollection();
    collection.fetch({
      limit: 2,
      offset: 2,
      success: function() {
        assert.equal(collection.at(0).id, 3);
        assert.equal(collection.length, 1);
        t();
      },
      error: function(err){
        assert(err);
      }
    });
  });

  it('should fetch collection with after_id', function(t) {
    var collection = new MyCollection();
    collection.fetch({
      limit: 2,
      after_id: 2,
      success: function() {
        assert.equal(collection.at(0).id, 3);
        assert.equal(collection.length, 1);
        t();
      },
      error: function(err){
        assert(err);
      }
    });
  });

  it('should fetch collection with before_id', function(t) {
    var collection = new MyCollection();
    collection.fetch({
      limit: 2,
      before_id: 3,
      success: function() {
        assert.equal(collection.at(0).id, 1);
        assert.equal(collection.at(1).id, 2);
        t();
      },
      error: function(err){
        assert(err);
      }
    });
  });

  it('should fetch collection sorted by given field', function(t) {
    var collection = new MyCollection();
    collection.fetch({
      sort: '-test',
      success: function() {
        assert.equal(collection.at(0).get('test'), 2);
        t();
      },
      error: function(err){
        assert(err);
      }
    });
  });

  it('should fetch collection filtered with given attributes', function(t) {
    var collection = new MyCollection();
    collection.fetch({
      where: {test: 2},
      success: function() {
        assert.equal(collection.length, 1);
        assert.equal(collection.at(0).get('test'), 2);
        t();
      },
      error: function(err){
        assert(err);
      }
    });
  });

  it('should fetch collection filtered with array value', function(t) {
    var collection = new MyCollection();
    collection.fetch({
      where: {arr: {
        '$in': ['foo']
      }},
      success: function() {
        assert.equal(collection.length, 1);
        assert.equal(collection.at(0).get('test'), 1);
        t();
      },
      error: function(err){
        assert(err);
      }
    });
  });

  it('should fetch collection filtered with multiple array values', function(t) {
    var collection = new MyCollection();
    collection.fetch({
      where: {arr: {
        '$in': ['foo', 'bar']
      }},
      success: function() {
        assert.equal(collection.length, 1);
        assert.equal(collection.at(0).get('test'), 1);
        t();
      },
      error: function(err){
        assert(err);
      }
    });
  });

  it('should remove a model from collection when destroyed', function(t) {
    var m = new MyCollection();
    m.fetch({success: function() {
      assert(m.length === 3);
      var model = m.at(2);
      model.destroy({
        success: function(model, response) {
          assert(m.length === 2, 'model was not removed from collection');
          m.fetch({
            success: function() {
              assert(m.length === 2, 'model was not removed from collection when fetched');
              t();
            },
            error: function(err) {
              assert(err);
            }
          });
        },
        error: function() {
          assert(err);
        },
        wait: true
      });
    }, error: function(err){
      assert(err);
    }});

  });

});