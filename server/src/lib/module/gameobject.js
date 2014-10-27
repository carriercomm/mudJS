// GameObject template object

var Module          = require('../module'),
    Character       = require('./character'),
    GameObjectModel = require('../../../db/models/gameobject'),
    Place           = require('./place'),
    utils           = require('./utils');

var GameObjectModule = function(options) {
    'use strict';

    var self = new Module();

    initialize();

    function initialize() {
        self.type = 'undefined'; // Each gameobject must overwrite this to be their type. Type is a colon separated string that describes the object type from general to specific

        self.name = 'undefined'; // Each gameobject must overwrite this to be their descriptive name

        self.description = 'undefined'; // Each gameobject should overwrite this

        _.extend(self, options);
    }
    
    // basic accessors
    self.getName = function() { return self.name; };

    self.getDescription = function() { return self.description; };
    
    self.getType = function() { return self.type; };

    // map types to game objects
    self.typeMap = function(type) {
        if(! type_map) {
            type_map = {
                //'dispenser:dirt' : require('./gameobject/dispenser/dirt') // TODO: uncomment when available
                //'item:dirt' : require('./gameobject/item/dirt') // TODO: uncomment when available
            };
        }

        if(type) return type_map[type];
        return type_map;
    };

    // Model operations
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
            
            callback(self);
        });
    };

    // Create
    function createMe__meta() {
        return {
        };
    }

    self.createMe = function(args, callback) {
        if(args.options) _.extend(args,args.options);

        var check = self.validate(createMe__meta(), args);
        if(! check.is_valid) throw check.errors();
        
        callback = ('function' === typeof callback) ? callback : function() {};
        
        args.type = self.type;

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

            callback(self);
        });
    };
    
    // Basic accessor methods for model data
    self.id = function() {
        return self.model._id;
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
    
    self.addInventory = function(item, callback) {
        // Add an item to my inventory
        var id = (item.model) ? (item.model.id || item.model._id) : (item.id || item._id);
        
        callback = ('function' === typeof callback) ? callback : function() {};
        
        if(! id) callback();
        
        if('undefined' === typeof self.model || 'undefined' === typeof self.model._id) callback();
        
        self.model.inventory.push(id);
        self.model.save(function(err) {
            if(err) throw err;
            
            GameObjectModel.findById(args.id, function(err, doc) {
                if(err) throw err;
                
                if(! doc) {
                    callback();
                    return;
                }
                
                doc.container = self.model._id;
                doc.save();
                
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
            
            GameObjectModel.findById(args.id, function(err, doc) {
                if(err) throw err;
                
                if(! doc) {
                    callback();
                    return;
                }
                
                doc.container = null;
                doc.save();
                
                callback();
            });
        });
    };
    
    return self;
};

module.exports = GameObjectModule;
