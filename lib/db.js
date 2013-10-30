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
  save: function(cb) {
    this.store().setItem(this.name, JSON.stringify(this.records), function() {
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
      self.store().setItem(model.get(model.idAttribute), JSON.stringify(model), function(err, res) {
          self.records.push(model.get(model.idAttribute));
          self.save(function(err) {
            return cb(err, model.toJSON(), res);
          });
      });
    }
  },
  find: function(model, options, cb) {
    debug("FIND: "+JSON.stringify(model));
    this.store().getItem(model.get(model.idAttribute), function(err, data) {
      data = data && JSON.parse(data)
      return cb(data ? null : new Error(), data);
    });
  },
  findAll: function(model, options, cb) {
    debug("FINDALL: "+JSON.stringify(model));
    var self = this;
      var models = [];
      var done = _.after(this.records.length, function(m) {
        return cb(null,models);
      });
      this.records.forEach(function(id) {
        self.store().getItem(id, function(err, data) {
          data = data && JSON.parse(data);
          models.push(data);
          done();
        });
      });
  },
  destroy: function(model, options, cb) {
    debug("DESTROY: "+JSON.stringify(model));
    var self = this;
    if (model.isNew()) {
      return false;
    }
    this.store().removeItem(model.get(model.idAttribute), function() {
      self.records = _.reject(self.records, function(id) {
        return id == model.get(model.idAttribute);
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
    this.store().setItem(model.get(model.idAttribute), JSON.stringify(model), function(err, res) {
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
