var Backbone = require('backbone');
var _ = require('underscore');
var debug = require('debug')('backbone-db');

var self = this;

function getStorage(name) {
  var storage = self.localStorage;
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
  }
  return storage;
}


Backbone.Db = function Db(name) {
  var self = this;
  if (!(self instanceof Db)) return new Db(name);
  this.name = name;
  var self = this;
  this.storage = getStorage(this.name);
  var records = this.store().getItem(this.name, function(err, records) {
    self.records = (records && records.split(',')) || [];
  });
};


Backbone.Db.prototype.sync = function(method, model, options) {
  options || (options = {});
  var self = this;
  var db;
  if(!(self instanceof Backbone.Db)) {
     db = model.db || options.db || new Backbone.Db(model.type || model.name || model.kind || "model");
  } else {
    db = self;
  }
  debug("sync %s %s",method,JSON.stringify(options));
  function callback(err, res, resp) {
    debug('callback '+err+" "+JSON.stringify(res));
    if((err && options.error) || (!err && !res && options.error)) {
      err || (err = new Error("not found"));
      return options.error(err, resp);
    } else if(options.success && res) {
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
    var key = '';

    if(options.url) {
      key = typeof options.url == "function" ? options.url() : options.url;
    } else if(model.url) {
      key = typeof model.url == "function" ? model.url() : model.url;
    }  else if(model.id) {
      key = model.id;
    }
    return this.name + (key ? ':' + key : '');
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
        if(model.collection) {
          var colKey = self._getKey(model.collection, options);
          self.store().getItem(colKey, function(err, res) {
            res = res && JSON.parse(res);
            res = res || [];
            if(!Array.isArray(res)) {
              res = [res];
            }
            res.push(model.get(model.idAttribute));
            self.store().setItem(colKey, JSON.stringify(res), function(err) {
              self.records.push(model.get(model.idAttribute));
              self.save(function(err) {
                return cb(err, model.toJSON(), res);
              });
            });
          });
        } else {
          self.records.push(model.get(model.idAttribute));
          self.save(function(err) {
            return cb(err, model.toJSON(), res);
          });
        }
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
    var self = this;
    var key = this._getKey(model, options);
    this.store().getItem(key, function(err, data) {
      if(!data || err) {
        return cb(err, []);
      }
      data = data && JSON.parse(data);
      if(!Array.isArray(data) || data.length == 0) {
        return cb(null, data || []);
      }
      var models = [];
      var done = _.after(data.length, function(m) {
        return cb(null,models);
      });

      data.forEach(function(id) {
        var m = new model.model({id:id});
        var key = self._getKey(m, options);
        self.store().getItem(key, function(err, data) {
          data = data && JSON.parse(data);
          models.push(data);
          done();
        });
      });
    });
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
      self.save(function(err) {
        cb(err, model);
      });
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
      if(model.collection) {

      }
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
    return this.storage;
  }
});
Backbone.Db.sync = Backbone.Db.prototype.sync;
module.exports = Backbone.Db;
