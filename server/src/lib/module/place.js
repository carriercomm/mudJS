// Place logic

var Module          = require('../module'),
    PlaceModel      = require('../../../db/models/place'),
    GateModel       = require('../../../db/models/gate'),
    GameObjectModel = require('../../../db/models/gameobject'),
    PlotModule      = require('./plot'),
    GateModule      = require('./gate'),
    _               = require('underscore');

var PlaceModule = function() {
    'use strict';
    
    var self = new Module();
    
    // Load from obj
    function loadMe__meta() {
        return {
            'model' : {
                'required' : true
            },
        };
    }
    
    self.loadMe = function(args, callback) {
        var check = self.validate(loadMe__meta(), args);
        if(! check.is_valid) throw check.errors();
        
        callback = ('function' === typeof callback) ? callback : function() {};
        
        self.model = args.model;
        
        self.plot = new (new PlotModule().typeMap(self.model.type))();
        
        callback(self);
        
        return self;
    };

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
        
        PlaceModel.findById(args.id, function(err, doc) {
            
            if(err) {
                callback(null);
                return;
            }
            
            if(! doc) {
                callback(null);
                return;
            }
            
            self.model = doc;
            
            self.plot = new (new PlotModule().typeMap(doc.type))();
            
            callback(self);
        });
    };

    // Create
    function createMe__meta() {
        return {
            'type' : {
                'required' : true,
                'type'     : 'string'
            },
            'is_spawn_point' : {
                'desc' : 'Flag to determine if this place should be created as a potential spawn point',
                'type'  : 'boolean'
            },
            'is_area_gate' : {
                'desc' : 'Flag to determine if this place can have a gate to another area',
                'type'  : 'boolean'
            }
        };
    }

    self.createMe = function(args, callback) {
        var check = self.validate(createMe__meta(), args);
        if(! check.is_valid) throw check.errors();

        callback = ('function' === typeof callback) ? callback : function() {};
        
        // Create new region model
        PlaceModel.create(_.pick(args, [
            'type',
            'is_spawn_point',
            'is_area_gate'
        ]), function(err, doc) {
            if(err) {
                callback(null);
                return;
            }
            
            self.model = doc;

            self.plot = new (new PlotModule().typeMap(doc.type))();
            
            callback(self);
        });
    };
    
    // Basic accessors
    self.id = function() {
        return self.model._id;
    };
    
    self.gates = function(callback) {
        callback = ('function' === typeof callback) ? callback : function() {};
        
        if(self._gates) callback(self._gates);
        
        // load gates
        self._gates = [];
        var gates = _.clone(self.model.gates);
        
        // recursive callback to load all gates
        function getGate(cb) {
            var g = gates.shift();
            
            if(! g) {
                cb();
                return;
            }
            
            new GateModule().findMe({ id: g}, function(gate) {
                self._gates.push(gate);
                getGate(cb);
            });
        }
        
        getGate(function() {
            callback(self._gates);
        });
    };
    
    // Other methods
    self.addCharacter = function(character, callback) {
        // Add a character to this place
        var id = (character.model) ? (character.model.id || character.model._id) : (character.id || character._id);
        if(! id) throw "No place id found!";
        
        callback = ('function' === typeof callback) ? callback : function() {};
        
        self.model.characters.push(id);
        self.model.save(function(err) {
            if(err) throw err;
            
            callback();
        });
    };
    
    self.removeCharacter = function(character, callback) {
        // Remove a character from this place
        var id = (character.model) ? (character.model.id || character.model._id) : (character.id || character._id);
        if(! id) throw "No place id found!";
        
        callback = ('function' === typeof callback) ? callback : function() {};
        
        self.model.characters.pull(id);
        self.model.save(function(err) {
            if(err) throw err;
            
            callback();
        });
    };
    
    self.addGate = function(gate, callback) {
        // Add a gate to this place
        var id = (gate.model) ? (gate.model.id || gate.model._id) : (gate.id || gate._id);
        if(! id) throw "No gate id found!";
        
        callback = ('function' === typeof callback) ? callback : function() {};
        
        self.model.gates.push(id);
        self.model.save(function(err) {
            if(err) throw err;
            
            delete self._gates; // refresh gates array
            
            callback();
        });
    };
    
    self.removeGate = function(gate, callback) {
        // Remove a gate from this place
        var id = (gate.model) ? (gate.model.id || gate.model._id) : (gate.id || gate._id);
        if(! id) throw "No gate id found!";
        
        callback = ('function' === typeof callback) ? callback : function() {};
        
        self.model.gates.pull(id);
        self.model.save(function(err) {
            if(err) throw err;
            
            delete self._gates; // refresh gates array
            
            callback();
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
                
                doc.place = self.model._id;
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
            
            GameObjectModel.findById(id, function(err, doc) {
                if(err) throw err;
                
                if(! doc) {
                    callback();
                    return;
                }
                
                doc.place = null;
                doc.save();
                
                callback();
            });
        });
    };
    
    // Summary of what is in this place
    self.summary = function(callback) {
        callback = ('function' === typeof callback) ? callback : function() {};
        
        var output = '';
        
        output = output + self.plot.getName() + "{{ br() }}{{ br () }}";
        output = output + self.plot.getDescription() + "{{ br() }}{{ br() }}";
        
        self.gates(function(gates) {
            if(gates.length < 1) {
                output = output + "Exits: none";
            }
            else {
                var exits = [];
                
                _.each(gates, function(g) {
                   exits.push(g.direction()); 
                });
                
                output = output + "Exits: " + _.toArray(exits).join(', ');
            }
            
            callback(output);
        });
    };

    return self;
};

module.exports = PlaceModule;
