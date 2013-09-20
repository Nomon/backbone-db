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

Backbone.Db = function Db(name) {
  var self = this;
  if (!(self instanceof Db)) return new Db(name);

  this.name = name;
  var self = this;
  var records = this.store().getItem(this.name, function(err, records) {
    self.records = (records && records.split(',')) || [];
  });
};


Backbone.Db.sync = function(method, model, options) {
  options || (options = {});
  var db = model.db || options.db || new Backbone.Db(model.name || model.kind || "model");
  debug("sync %s %s %s",method,model.url(),JSON.stringify(options));
  function callback(err, res, resp) {
    debug('callback '+err+" "+JSON.stringify(res));
    if((err && options.error) || (!err && !res)) {
      err || (err = new Error("not found"));
      return options.error(err, resp);
    } else if(options.success) {
      debug('success %s', JSON.stringify(res));
      return options.success(res, resp);
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
      if (typeof model.get(model.idAttribute) !== "undefined") {
        return db.find(model, options, callback);
      } else {
        return db.findAll(model, options, callback);
      }
  }
};



_.extend(Backbone.Db.prototype, Backbone.Events, {
  _getKey: function (model, options) {
    var key;
    if(options.url) {
      key = typeof options.url == "function" ? options.url() : options.url;
    } else if(model.url) {
      key = typeof model.url == "function" ? model.url() : model.url;
    }  else if(model.id) {
      key = model.id;
    }
    return this.name + ':' + key;
  },
  save: function(cb) {
    this.store().setItem(this.name, this.records.join(','), function() {
      cb(null);
    });
  },
  create: function(model, options, cb) {
    debug('CREATE: '+JSON.stringify(model));
    var self = this;
    if (model.isNew()) {
      this.createId(model, options, function(err, id) {
        model.set(model.idAttribute, id);
        store(model);
      });
    } else {
      store(model);
    }
    function store(model) {
      var key = self._getKey(model, options);
      self.store().setItem(key, JSON.stringify(model), function(err, res) {
        self.records.push(model.get(model.idAttribute));
        self.save(function() {});
        return cb(err, model.toJSON(), res);
      });
    }
  },
  find: function(model, options, cb) {
    debug("FIND: "+JSON.stringify(model));
    var key = this._getKey(model, options);
    this.store().getItem(key, function(err, data) {
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
    var key = this._getKey(model, options);
    this.store().removeItem(key, function() {
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
    var key = this._getKey(model, options);
    debug('update key: '+key);
    this.store().setItem(key, JSON.stringify(model), function(err, res) {
      cb(err, model.toJSON(), res);
    });
  },  createId: (function(id) {
    return function (model, options, cb) {
      debug('createId: '+id);
      cb(null, id++);
    }
  })(1),
  // expose "raw" storage backend.
  store: function() {
    return storage;
  }
});

module.exports = Backbone.Db;