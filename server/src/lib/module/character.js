// Character logic

var Module           = require('../module'),
    CharacterModel   = require('../../../db/models/character'),
    GameObjectModel  = require('../../../db/models/gameobject'),
    PlaceModule      = require('./place'),
    GameObjectModule = require('./gameobject'),
    _                = require('underscore');

var CharacterModule = function() {
    'use strict';

    var self = new Module();

    // Find
    function findMe__meta() {
        return {
            'id' : {
                'required' : true,
            }
        };
    }

    self.findMe = function(args, callback) {
        var check = self.validate(findMe__meta(), args);
        if(! check.is_valid) throw check.errors();

        callback = ('function' === typeof callback) ? callback : function() {};

        CharacterModel.findById(args.id, function(err, doc) {
            if(err) {
                callback(null);
                return;
            }

            if(! doc) {
                callback(null);
                return;
            }

            self.model = doc;

            callback(self);
        });
    };

    // Create
    function createMe__meta() {
        return {
            'ownedBy'  : {
                'desc' : 'The id of the user that owns this character',
                'type' : 'string'
            },
            'fullName' : {
                'desc' : 'Characters full name',
                'type'  : 'string'
            },
        };
    }

    self.createMe = function(args, callback) {
        if(args.options) _.extend(args,args.options);

        var check = self.validate(createMe__meta(), args);
        if(! check.is_valid) throw check.errors();

        callback = ('function' === typeof callback) ? callback : function() {};

        // Create new region model
        CharacterModel.create(_.pick(args, [
            'ownedBy',
            'fullName'
        ]), function(err, doc) {
            if(err) {
                callback(null);
                return;
            }

            self.model = doc;

            callback(self);
        });
    };

    // Basic accessor methods
    self.id = function() {
        return self.model._id;
    };

    self.place = function() {
        return self.model.place;
    };

    self.permissionGroup = function() {
        return self.model.permissionGroup;
    };

    // Other methods
    self.setPlace = function(place, callback) {
        // Set the place for this character
        var id = (place.model) ? (place.model.id  || place.model._id): (place.id || place._id);
        if(! id) throw "No place id found!";

        callback = ('function' === typeof callback) ? callback : function() {};

        self.model.place = id;
        self.model.save(function(err) {
            if(err) throw err;

            new PlaceModule().findMe({ id: id }, function(obj) {
                obj.addCharacter(self, function() {
                    callback();
                });
            });
        });
    };

    self.unsetPlace = function(callback) {
        // Remove the place this character is in
        callback = ('function' === typeof callback) ? callback : function() {};

        if(self.model.place) {
            new PlaceModule().findMe({ id: self.model.place }, function(obj) {
                obj.removeCharacter(self);

                callback();
            });
        }
        else {
            callback();
        }
    };

    self.logout = function(callback) {
        callback = ('function' === typeof callback) ? callback : function() {};

        self.unsetPlace(function() {
            callback();
        });
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

                doc.character = self.model._id;
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

                doc.character = null;
                doc.save();

                delete self._inventory; // refresh inventory array

                callback();
            });
        });
    };

    return self;
};

module.exports = CharacterModule;
