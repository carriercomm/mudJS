// Village Biome

var Biome = require('../biome');

var VillageBiome = function() {
    'use strict';
    
    var self = new Biome();

    initialize();

    function initialize() {
        self.type = 'village';

        // This number is only needed if we have non-required plots (meaning they go into a pool that randomly picks some)
        self.buildRule({
            rule: 'plot_count_modifier',
            value: 0
        });
    
        // our spawn point
        self.buildPlot({
            type           : 'dirt_road',
            is_required    : true,
            is_spawn_point : true,
            must_gate_to    : [ // spawn point must gate to something, right???
                {
                    'type'      : ['dirt_road'],
                    'min'       : 1,
                    'max'       : 1,
                    'direction' : 'coplanar',
                    'one_way'   : false
                }
            ],
            props : [
                { 'type' : 'dispenser:dirt', 'quantity' : 1 }
            ]
        });
        
        // more raod we can travel on
        self.buildPlot({
            type           : 'dirt_road',
            is_required    : true,
            is_spawn_point : false,
            can_gate_to    : [
                {
                    'type'      : ['dirt_road'],
                    'min'       : 1,
                    'max'       : 1,
                    'direction' : 'coplanar',
                    'one_way'   : false
                }
            ],
            props : [
                { 'type' : 'dispenser:dirt', 'quantity' : 1 }
            ]
        });
    }

    return self;
};

module.exports = VillageBiome;
