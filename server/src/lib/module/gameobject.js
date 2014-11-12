// GameObject

var Module          = require('../module'),
    Character       = require('./character'),
    GameObjectModel = require('../../../db/models/gameobject'),
    Place           = require('./place'),
    Prop            = require('./prop'),
    utils           = require('./utils'),
    _      = require('underscore');

var GameObjectModule = function(options) {
    'use strict';

    var self = new Module();

    // Find
    function findMe__meta() {
        return {
            'id' : {
                'required' : true
            }
        };
    }

    self.findMe = function(args, callback) {
        var check = self.validate(findMe__meta(), args);
        if(! check.is_valid) throw check.errors();

        callback = ('function' === typeof callback) ? callback : function() {};

        GameObjectModel.findById(args.id, function(err, doc) {
            if(err) {
                callback(null);
                return;
            }

            if(! doc) {
                callback(null);
                return;
            }

            self.model = doc;

            self.prop = new (new Prop().typeMap(self.model.type))();

            callback(self);
        });
    };

    // Create
    function createMe__meta() {
        return {
            'type' : {
                'required' : true,
                'type'     : 'string'
            }
        };
    }

    self.createMe = function(args, callback) {
        if(args.options) _.extend(args,args.options);

        var check = self.validate(createMe__meta(), args);
        if(! check.is_valid) throw check.errors();

        callback = ('function' === typeof callback) ? callback : function() {};

        // Create new region model
        GameObjectModel.create(_.pick(args, [
            'type'
            //TOOD Figure out additon args (like a generic data obj)
        ]), function(err, doc) {
            if(err) {
                callback(null);
                return;
            }

            self.model = doc;

            self.prop = new (new Prop().typeMap(self.model.type))();

            callback(self);
        });
    };

    // Basic accessor methods for model data
    self.id = function() {
        return self.model._id;
    };

    self.type = function() {
        return self.model.type;
    };

    // storage handling
    function addTo__meta() {
        return {
            'place' : {
                'requiredIfNot' : [ 'character', 'container' ],
                'type'          : 'object'
            },
            'character' : {
                'requiredIfNot' : [ 'place', 'container' ],
                'type'          : 'object'
            },
            'container' : {
                'requiredIfNot' : [ 'place', 'character' ],
                'type'          : 'object'
            }
        };
    }

    self.addTo = function(args, callback) {
        var check = self.validate(removeFromCurrentContainer__meta(), args);
        if(! check.is_valid) throw check.errors();

        callback = ('function' === typeof callback) ? callback : function() {};

        if('undefined' === typeof self.model || 'undefined' === typeof self.model._id) callback(); // don't do anything if we are not in the db

        var f = function() { callback(); }; // Start out function chain with just the callback

        if(args.container) {
            callback = f;
            f = function() {
                args.container.addInventory(self, function() {
                    callback();
                });
            };
        }

        if(args.place) {
            callback = f;
            f = function() {
                args.place.addInventory(self, function() {
                    callback();
                });
            };
        }

        if(args.character) {
            callback = f;
            f = function() {
                args.character.addInventory(self, function() {
                    callback();
                });
            };
        }

        // run the function chain
        f();

    };

    function removeFrom__meta() {
        return {
            'place' : {
                'requiredIfNot' : [ 'character', 'container' ],
                'type'          : 'object'
            },
            'character' : {
                'requiredIfNot' : [ 'place', 'container' ],
                'type'          : 'object'
            },
            'container' : {
                'requiredIfNot' : [ 'place', 'character' ],
                'type'          : 'object'
            }
        };
    }

    self.removeFrom = function(args, callback) {
        var check = self.validate(removeFrom__meta(), args);
        if(! check.is_valid) throw check.errors();

        callback = ('function' === typeof callback) ? callback : function() {};

        if('undefined' === typeof self.model || 'undefined' === typeof self.model._id) callback(); // don't do anything if we are not in the db

        var f = function() { callback(); }; // Start out function chain with just the callback

        if(args.container) {
            callback = f;
            f = function() {
                args.container.removeInventory(self, function() {
                    callback();
                });
            };
        }

        if(args.place) {
            callback = f;
            f = function() {
                args.place.removeInventory(self, function() {
                    callback();
                });
            };
        }

        if(args.character) {
            callback = f;
            f = function() {
                args.character.removeInventory(self, function() {
                    callback();
                });
            };
        }

        // run the function chain
        f();
    };

    self.inventory = function(callback) {
        callback = ('function' === typeof callback) ? callback : function() {};

        if(self._inventory) callback(self._inventory);

        // load gates
        self._inventory = [];
        var inventory = _.clone(self.model.inventory);

        // recursive callback to load all gates
        function getInventory(cb) {
            var go = inventory.shift();

            if(! go) {
                cb();
                return;
            }

            new GameObjectModule().findMe({ id: go}, function(gameobject) {
                self._inventory.push(gameobject);
                getInventory(cb);
            });
        }

        getInventory(function() {
            callback(self._inventory);
        });
    };

    self.addInventory = function(item, callback) {
        // Add an item to my inventory
        var id = (item.model) ? (item.model.id || item.model._id) : (item.id || item._id);

        callback = ('function' === typeof callback) ? callback : function() {};

        if(! id) callback();

        if('undefined' === typeof self.model || 'undefined' === typeof self.model._id) callback();

        self.model.inventory.push(id);
        self.model.save(function(err) {
            if(err) throw err;

            GameObjectModel.findById(id, function(err, doc) {
                if(err) throw err;

                if(! doc) {
                    callback();
                    return;
                }

                doc.container = self.model._id;
                doc.save();

                delete self._inventory; // refresh inventory array

                callback();
            });
        });
    };

    self.removeInventory = function(item, callback) {
        // Remove an item from my inventory
        var id = (item.model) ? (item.model.id || item.model._id) : (item.id || item._id);

        callback = ('function' === typeof callback) ? callback : function() {};

        if(! id) callback();

        if('undefined' === typeof self.model || 'undefined' === typeof self.model._id) callback();

        self.model.inventory.pull(id);
        self.model.save(function(err) {
            if(err) throw err;

            GameObjectModel.findById(id, function(err, doc) {
                if(err) throw err;

                if(! doc) {
                    callback();
                    return;
                }

                doc.container = null;
                doc.save();

                delete self._inventory; // refresh inventory array

                callback();
            });
        });
    };

    // Summary of what this object is
    self.summary = function(callback) {
        callback = ('function' === typeof callback) ? callback : function() {};

        var output = '';

        output = output + self.prop.getName() + "{{ br() }}{{ br () }}";
        output = output + self.prop.getDescription();

        callback(output);
    };

    return self;
};

module.exports = GameObjectModule;
