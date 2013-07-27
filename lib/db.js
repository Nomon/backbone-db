var Backbone = require('backbone');
var _ = require('underscore');
var debug = require('debug')('backbone-db');
var storage = this.localStorage;
var database = {};

if(!storage) {
  // "localStorage"
  debug('creating mock storage');
  storage = {
    getItem: function(key, cb) {
      debug('getItem: '+key);
      cb(null, database[key])
      return database[key];
    },
    setItem: function(key, value, cb) {
      debug('setItem: '+key+' = '+value);
      database[key] = value;
      cb(null, value);
    },
    removeItem: function(key, cb) {
      debug('removeItem: '+key);
      delete database[key];
      cb(null, true);
    }
  };
};

exports.storage = storage;

Backbone.Db = function(name) {
  this.name = name;
  var self = this;
  var records = this.store().getItem(this.name, function(err, records) {
    self.records = (records && records.split(',')) || [];
  });
};


_.extend(Backbone.Db.prototype, Backbone.Events, {
  save: function(cb) {
    this.store().setItem(this.name, this.records.join(','), function() {
      cb(null);
    });
  },
  create: function(model, options, cb) {
    var self = this;
    if (!model.id) {
      model.id = id();
      model.set(model.idAttribute, model.id);
    }
    this.store().setItem(this.name+":"+model.id, JSON.stringify(model), function() {
      self.records.push(model.id.toString());
      self.save(function() {});
      return cb(null, model);
    });

  },
  find: function(model, options, cb) {
    debug("FIND: "+JSON.stringify(model));
    var data = this.store().getItem(this.name+':'+model.id, function(err, data) {
      data = data && JSON.parse(data)
      return cb(data ? null : new Error(), data);
    });
  },
  findAll: function(model, options, cb) {
    debug("FINDALL: "+JSON.stringify(model));
    var data = _.chain(this.records)
      .map(function(id){
        var data = this.store().getItem(this.name+':'+id, function(err, data) {

        });
        return data && JSON.parse(data);
      }, this)
      .compact()
      .value();
    return cb(null, data);
  },
  destroy: function(model, options, cb) {
    debug("DESTROY: "+JSON.stringify(model));
    var self = this;
    if (model.isNew()) {
      return false;
    }
    this.store().removeItem(this.name+":"+model.id, function() {
      self.records = _.reject(self.records, function(id){
        return id === model.id.toString();
      });
      self.save(cb);
    });
  },
  update: function(model, options, cb) {
    debug('UPDATE: '+JSON.stringify(model));
    if(model.isNew()) {
      debug('new');
      return this.create(model, options, cb);
    }
    this.store().setItem(this.name+":"+model.id, JSON.stringify(model), function(err, res) {
      cb(err, model);
    });
  }, createId: (function(id) {
    return function (model, options, cb) {
      model.id = id++;
      cb(null, model);
    }
  })(1),
  // expose "raw" storage backend.
  store: function() {
    return storage;
  }
});

Backbone.Db.sync = function(method, model, options) {
  options || (options = {});
  var db = model.db || options.db || new Backbone.Db(model.name || model.kind || "model");
  debug('Db.sync: '+method+" "+JSON.stringify(model)+" opt: "+JSON.stringify(options.success));

  function callback(err, res) {
    debug('callback '+err+" "+JSON.stringify(res));
    if(err && options.error) {
      debug('err')
      return options.error(err);
    } else if(options.success) {
      debug('success' +  JSON.stringify(res));
      return options.success(res);
    }
  }

  switch (method) {
    case 'create':
      return db.create(model, options, callback);
    case 'update':
      return db.update(model, options, callback);
    case 'delete':
      return db.destroy(model, options, callback);
    case 'read':
      if (typeof model.id !== "undefined") {
        return db.find(model, options, callback);
      } else {
        return db.findAll(model, options, callback);
      }
  }
};

module.exports = Backbone.Db;