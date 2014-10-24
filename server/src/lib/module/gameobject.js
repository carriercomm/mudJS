// GameObject template object

var Module = require('../module'),
    utils  = require('./utils');

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

    self.getName = function() { return self.name; };

    self.getDescription = function() { return self.description; };

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


    return self;
};

module.exports = GameObjectModule;
