// World management

var Module       = require('../module'),
    VillageBiome = require('./biome/village'),
    Models       = require('../../../db/models'),
    Region       = require('./region'),
    Place        = require('./place'),
    Gate         = require('./gate'),
    GameObject   = require('./gameobject'),
    _            = require('underscore');

var WorldModule = function() {
    'use strict';
    
    var self = new Module();

    // Find spawn point
    self.findSpawnPoint = function(callback) {
        Models.place.findOne({ is_spawn_point: true }, 'id', function(err, doc) {
            if(!doc) {
                initWorld(function(region) {
                    region.findSpawnPoints(function(list) {
                        callback(list.shift());
                    });
                });
            }
            else {
                new Place().findMe({ id: doc._id }, function(place) {
                    callback(place);
                });
            }
        });
    };

    function initWorld(callback) {
        callback = ('function' === typeof callback) ? callback : function() {};
        
        // Using the village biome as that is all we have right now
        var villageBiome = new VillageBiome();

        var regionData = villageBiome.generate();
        
        new Region().createMe(_.pick(regionData, [
            'type'
        ]), function(region) {
            
            // place temp id to real obj mapping (for gates)
            var place_tempIdTOrealObj = {};
            
            // recursion to add all gameobjects to a place before continuing
            function addInventory(plot, place, cb) {
                var go = plot.props.shift();
                
                if(! go) {
                    cb();
                    return;
                }
                
                new GameObject().createMe(go, function(gameobject) {
                    place.addInventory(gameobject, function() {
                        addInventory(plot, place, cb);
                    });
                });
            }
            
            // recursion to wait until all places are created before processing gates
            function createPlaces(cb) {
                var p = regionData.plots.shift();
                
                if(! p) {
                    cb();
                    return;
                }
                
                new Place().createMe(p, function(placeObj) {
                    addInventory(p, placeObj, function() {
                        place_tempIdTOrealObj[p.tempId] = placeObj; // setup temp id to real obj mapping
                        region.addPlace(placeObj);
                        createPlaces(cb);
                    });
                });
            }
            
            // recursion to wait until all gates are created before calling the return callback
            function createGates(cb) {
                var g = regionData.gates.shift();
                
                if(! g) {
                    cb();
                    return;
                }
                
                // Convert temp ids into real ids
                var gate_def         = _.clone(g);
                gate_def.source      = (place_tempIdTOrealObj[g.source]).id();
                gate_def.destination = (place_tempIdTOrealObj[g.destination]).id();
                
                new Gate().createMe(gate_def, function(gateObj) {
                    (place_tempIdTOrealObj[g.source]).addGate(gateObj);
                    createGates(cb);
                });
            }
            
            createPlaces(function() {
                createGates(function() {
                    callback(region);
                });
            });
        });
    }

    return self;
};

module.exports = WorldModule;
