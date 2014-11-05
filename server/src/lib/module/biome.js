// Biome logic - A biome is the virtual template from which to create actual regions

var Module = require('../module'),
    _      = require('underscore'),
    Plot   = require('./plot'),
    Prop   = require('./prop'),
    Gate   = require('./gate');

var BiomeModule = function() {
    'use strict';
    
    var self = new Module();

    var type_map; // private variable used by self.typeMap

    initialize();

    function initialize() {
        self.type   = 'undefined'; // Each biome must overwrite this to be their type, their type needs to be the same name as their file name

        // The rules and flags neccessary to build a biome, use the schema functions to build this out
        self.build = {
            rules    : { },
            plots    : {
                required : [ ], // Any plots set to required will be store here and processed always
                pool     : [ ] // Any non-required plot will go here, these will be picked from randomly (as long there is room) and added in
            }
        };

        // Plot Map - used to create plot objects when generate is called
        self.plot_map = new Plot().typeMap();
        
        // Prop Map - used to create prop objects when generate is called
        self.prop_map = new Prop().typeMap();
    }

    // create a map of plots that can then be added as a region with places
    self.generate = function() {
        // final return variable with everything generated
        var region = {
            type  : self.type,
            plots : [],
            gates : []
        };

        // Clone out build so we can keep it intact for future generate calls
        var build = _.clone(self.build);
        
        // number of plots to be added
        var num_plots = Math.floor((Math.random() * (self.maximumGeneratedPlots() - self.minimumGeneratedPlots()))) + self.minimumGeneratedPlots();
        
        // array of all plots added, so we can process gates
        var added_plots = [];
        
        // First add the required plots
        _.each(build.plots.required, function(p) {
            for(var i = p.spawned; i < p.spawn_minimum; i++) { // spawn x number of required plots
                // add plot
                var opt = _.pick(p,placeOptions());
                opt.tempId = p.tempId = region.plots.length; // Assign a temp id based on it's index in region.plots so we can track generated gates
                
                // Get the plot object
                var a_plot = new self.plot_map[p.type](opt);
                
                // Add props to the plot object
                for(var pri = 0; pri < p.props.length; pri++) {
                    var item = p.props[pri];
                    var a_prop = new self.prop_map[item.type]();
                    a_plot.addProp(a_prop);
                }
                
                // Add the plots to the region
                region.plots.push( a_plot );
                
                added_plots.push(p);
                p.spawned++;
                num_plots--;
            }
        });
        
        // Then add the rest
        var plot_count = build.plots.pool.length;

        var continue_loop = num_plots * 100;

        while(num_plots > 0 && continue_loop > 0 && plot_count > 0) {
            var p = build.plots.pool[ Math.floor(Math.random() * plot_count) ];

            // Don't spawn unless we haven't reached the maximum
            if(p.spawn_maximum === 0 || p.spawned < p.spawn_maximum) {
                // add plot
                var opt = _.pick(p,placeOptions());
                opt.tempId = p.tempId = region.plots.length; // Assign a temp id based on it's index in region.plots so we can track generated gates
                
                // Get the plot object
                var a_plot = new self.plot_map[p.type](opt);
                
                // Add props to the plot object
                for(var pri = 0; pri < p.props.length; pri++) {
                    var item = p.props[pri];
                    var a_prop = new self.prop_map[item.type]();
                    a_plot.addProp(a_prop);
                }
                
                // Add the plots to the region
                region.plots.push( a_plot );
                
                added_plots.push(p);
                p.spawned++;
                num_plots--;
            }

            // Decrease continue loop every time, this helps prevent an infinite loop if all plots have reached their spawn_maximum
            continue_loop--;
        }
        
        // Process gates
        var seen     = 0; // we run through plots until we have seen them all
        var ap_count = added_plots.length; // we compare seen against this to determine when we have seen them all
        var ap       = added_plots.shift(); // first plot to process
        var gM       = new Gate(); // Using this for random direction generation
        
        var fFilterGatesBySourceIdFactory = function(_ap) { // find any gate relate to the current source plot id
            return function(gt) { // _.filter function
                return gt.source === _ap.tempId;
            };
        };
        
        var fFilterGatesBySourceOrDestPlotFactory = function(sid, did) { // find a gates for the two ids provided, used in aleady has a gate test
            return function(gt) { // _.filter function
                return (gt.source === sid && gt.destination === did) || (gt.source === did && gt.destination === sid);
            };
        };
        
        // map gates by their direction, used to make sure we don't use the same direction twice
        var fMapGates = function(o) { // _.map function
            return o.direction;
        };
        
        while(ap && seen < ap_count) {
            var gate_def_list = [];
            var must_have_gates = false;
            
            if(ap.must_gate_to) { // must_gate_to processed 
                gate_def_list = ap.must_gate_to;
                must_have_gates = true;
            }
            else { // can_gate_to processed
                gate_def_list = ap.can_gate_to;
                must_have_gates = false;
            }
            
            for(var g = 0; g < gate_def_list.length; g++) {
                var gate = gate_def_list[g];
                
                // Get a list of current gates assigned to this source plot
                var existing_gates = _.map( _.filter(region.gates, fFilterGatesBySourceIdFactory(ap)), fMapGates );
                
                if(existing_gates.length > gate.min) break; // We have enough gates for this plot
                
                if('string' === typeof gate.type) gate.type = [ gate.type ]; // Just in case gate.type only has one option and it's a string
                
                var np = added_plots.length;
                
                var num_gates_to_process = 0;
                if(must_have_gates) {
                    num_gates_to_process = Math.floor(Math.random() * (gate.max + 1 - gate.min));
                    if(num_gates_to_process < 1) num_gates_to_process = 1;
                }
                else {
                    num_gates_to_process = Math.floor(Math.random() * (gate.max + 1));
                    if(num_gates_to_process < 1) continue; // we randomly don't generate gates for this entry, move along
                }
                
                var cont_g_loop = num_gates_to_process * 100;
                
                while(num_gates_to_process > 0 && cont_g_loop > 0 && np > 0) {
                    cont_g_loop--; // we don't want an infinite loop so this will stop the processing eventually
                    
                    var pap = added_plots[ Math.floor(Math.random() * np) ];
                    
                    if(! _.contains(gate.type, pap.type) ) continue; // source plot can't connect to this type of destination plot
                    
                    if( (_.filter(region.gates, fFilterGatesBySourceOrDestPlotFactory(ap.tempId, pap.tempId))).length > 0) continue; // We already have a gate for these two plots
                    
                    // find a direction
                    var direction;
                    for(var dir = 0; dir < 100; dir++) {
                        // Get a random direction
                        var _d = gM.randomDirection({'directionType' : gate.direction });
                        
                        if(_.contains(existing_gates, _d)) continue; // We already have this direction setup as a gate, find another one
                        
                        direction = _d; // We found the direction we were looking for
                    }
                    
                    if(! direction) break; // If we couldn't find a viable random direction to assign a gate to, we are done...
                    
                    var gate_def = {
                        source      : ap.tempId,
                        destination : pap.tempId,
                        direction   : direction
                    };
                    
                    region.gates.push( gate_def );
                    
                    // Add in the opposite direction
                    if(! gate.one_way) {
                        gate_def = {
                            source      : pap.tempId,
                            destination : ap.tempId,
                            direction   : gM.oppositeDirection({ 'direction' : direction })
                        };
                        
                        region.gates.push( gate_def );
                    }
                    
                    num_gates_to_process--;
                }
            }
            
            seen++; // the number of plots we have seen
            
            added_plots.push(ap); // Put the old one back on
            
            ap = null;
            ap = added_plots.shift(); // Get a new one to attempt to process
        }
        
        return region;
    };

    self.minimumGeneratedPlots = function() {
        var min = 0;

        _.each(self.build.plots.required, function(p) { min = min + p.spawn_minimum; });

        if(min < 1) min = 1;

        return min;
    };

    self.maximumGeneratedPlots = function() {
        return self.minimumGeneratedPlots() + (self.build.rules.plot_count_modifier || 0);
    };

    // Add or set a schema rule
    function buildRule__meta() {
        return {
            'rule' : {
                'required' : true,
                'enum'     : [
                    /* plot_count_modifier
                     *      set this value to increate the range of plots.
                     *          Min Plots = # of Plots flagged required or one (1).
                     *          Max Plots = Min Plots + Plot Count Modifier
                     */
                    'plot_count_modifier'
                ]
            },
            'value' : {
                'required' : true,
            }
        };
    }

    self.buildRule = function(args) {
        var check = self.validate(buildRule__meta(), args);

        if(check.is_valid) {
            self.build.rules[ args.rule ] = args.value;
        }
        else {
            throw check.errors();
        }
    };

    // Add a plot
    function buildPlot__meta() {
        return {
            'type' : {
                'desc'     : 'The plot type',
                'required' : true,
                'enum'     : [
                    // The list of all plot types
                    'dirt_road'
                ]
            },
            'gate_minimum' : {
                'desc' : 'A number representing the minimum number of gates that must be added to this plot, used by can_gate_to',
                'type' : 'number'
            },
            'gate_maximum' : {
                'desc' : 'A number representing the maximum number of gates that can be added to this plot, used  by can_gate_to',
                'type' : 'number'
            },
            /* can_gate_to example
             *      {
             *          type : 'dirt_road',
             *          min  : 1,
             *          max  : 1,
             *          direction : coplanar, // options are coplanar, vertical or any. in/out directions are special and are setup with areas contained in a room
             *          one_way   : false // true if gate should only be setup one way, otherwise false
             *      }
             */
            'can_gate_to' : {
                'desc' : 'A list of hashes of plot types, amounts(min/max) and their direction type this plot can be connected to',
                'requiredIfNot' : [ 'must_gate_to' ]
            },
            /* must_gate_to example
             *      {
             *          type : 'dirt_road',
             *          min  : 1,
             *          max  : 1,
             *          direction : coplanar, // options are coplanar, vertical or any. in/out directions are special and are setup with areas contained in a room
             *          one_way   : false // true if gate should only be setup one way, otherwise false
             *      }
             */
            'must_gate_to' : {
                'desc' : 'A list of hashes of plot types, amounts(min/max) and their direction type this plot must connect to, this is used instead of can_gate_to if available',
                'requiredIfNot' : [ 'can_gate_to' ]
            },
            'spawn_minimum' : {
                'desc' : 'Minimum number of plots of this type that can be spawned. Defaults to 0 (no minimum)',
                'type' : 'number'
            },
            'spawn_maximum' : {
                'desc' : 'Maximum number of plots of this type that can be spawned. Defaults to 0 (no maximum). This is really only useful when the plot is required.',
                'type' : 'number'
            },
            'is_required' : {
                'desc' : 'Flag to determine if this is required when generating the region from this biome',
                'type'  : 'boolean'
            },
            'os_spawn_point' : {
                'desc' : 'Flag to determine if this plot should be created as a potential spawn point',
                'type'  : 'boolean'
            },
            'is_area_gate' : {
                'desc' : 'Flag to determine if this plot can have a gate to another area',
                'type'  : 'boolean'
            },
            /* props example
             *      [
             *          { 'type' : 'dispenser:dirt', 'quantity' : 1 }
             *      ]
             */
            'props' : {
                'desc' : 'Array json objects of the with the prop type and quatity that will make up the inventory of a place',
                'type' : 'object'
            }
        };
    }

    self.buildPlot = function(args) {
        var check = self.validate(buildPlot__meta(), args);

        // Misc. Flags
        if(! _.has(args, 'is_required'))    _.extend(args, {is_required: false});
        if(! _.has(args, 'is_spawn_point')) _.extend(args, {is_spawn_point: false});

        // Plot spawning, minimum and maximums
        if(! _.has(args, 'spawn_minimum')) _.extend(args, {spawn_minimum: 0});
        if(! _.has(args, 'spawn_maximum')) _.extend(args, {spawn_maximum: 0});
        _.extend(args, {spawned: 0}); // used to track how many are spawned during a generate call

        if(args.spawn_minimum < 1) args.spawn_minimum = 1; // If we added a plot into the build, the minimum should at least be one
        if(args.spawn_maximum > 0 && args.spawn_maximum < args.spawn_minimum) args.spawn_maximum = args.spawn_minimum; // make sure we are sane when we have a maximum

        if(check.is_valid) {
            if(args.is_required) {
                self.build.plots.required.push(args);
            }
            else {
                self.build.plots.pool.push(args);
            }
        }
        else {
            throw check.errors();
        }
    };

    // placeOptions - attributes from buildPlot that should be transfered over to a place object
    function placeOptions() {
        return [
            'is_spawn_point'
        ];
    }

    // map types to biome objects
    self.typeMap = function(type) {
        if(! type_map) {
            type_map = {
                'village' : require('./biome/village')
            };
        }

        if(type) return type_map[type];
        return type_map;
    };

    return self;
};

module.exports = BiomeModule;
