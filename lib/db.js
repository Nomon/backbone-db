var Backbone = require('backbone');
var _ = require('underscore');
var debug = require('debug')('db');
var deferred = require('backbone-deferred');
var storage = this.localStorage;
var database = {};

if(!storage) {
  // "localStorage"
  storage = {
    getItem: function(key) {
      debug('getItem: '+key);
      return database[key];
    },
    setItem: function(key, value) {
      debug('setItem: '+key+'='+value);
      database[key] = value;
    },
    removeItem: function(key) {
      debug('removeItem: '+key);
      delete database[key];
    }
  };
};

exports.storage = storage;

Backbone.Db = function(name) {
  this.name = name;
  this._store = storage;
  var records = this._store.getItem(this.name);
  this.records = (records && records.split(',')) || [];
};
var nextId = 1;

function id() {
  return nextId++;
}

_.extend(Backbone.Db.prototype, Backbone.Events, {
  save: function(model, options, success, fail) {
    this.store().setItem(this.name, this.records.join(','));
    success(model);
  },
  create: function(model, options, success, fail) {
    debug("CREATE: "+JSON.stringify(model));
    if (!model.id) {
      model.id = id();
      model.set(model.idAttribute, model.id);
    }
    this.store().setItem(this.name+":"+model.id, JSON.stringify(model));
    this.records.push(model.id.toString());
    this.save();
    return success(model);
  },
  find: function(model, options, success, fail) {
    debug("FIND: "+JSON.stringify(model));
    var data = this.store().getItem(this.name+':'+model.id);
    success(data && JSON.parse(data));
    return data && JSON.parse(data);
  },
  findAll: function(model, options, success, fail) {
    debug("FINDALL: "+JSON.stringify(model));
    var data = _.chain(this.records)
      .map(function(id){
        var data = this.store().getItem(this.name+':'+id);
        return data && JSON.parse(data);
      }, this)
      .compact()
      .value();
    success(data);
    return data && JSON.parse(data);
  },
  destroy: function(model, options, success, fail) {
    debug("DESTROY: "+JSON.stringify(model));
    if (model.isNew())
      return false;

    this.store().removeItem(this.name+":"+model.id);
    this.records = _.reject(this.records, function(id){
      return id === model.id.toString();
    });
    this.save();
    success(model);
    return model;
  },
  update: function(model, options, success, fail) {
    success(model);
  },
  // expose "raw" storage backend.
  store: function() {
    return this._store;
  }
});

Backbone.Db.sync = function(method, model, options) {
  var store = model.store || new Backbone.Db(model.name || 'model');
  model.store = store;

  function success(result) {
    if (options.success) {
      options.success(result);
    }
  }

  function error(result) {
    if (options.error) {
      options.error(result);
    }
  }

  options || (options = {});

  switch (method) {
    case 'create':
      return store.create(model, options, success, error);
    case 'update':
      return store.update(model, options, success, error);
    case 'delete':
      return store.destroy(model, options, success, error);
    case 'read':
      if (typeof model.id !== "undefined") {
        return store.find(model, options, success, error);
      } else {
        return store.findAll(model, options, success, error);
      }
  }
};

module.exports = Backbone.Db;