// Prop logic -  - A prop is the virtual template from which to create actual gameobjects

var Module = require('../module'),
    _      = require('underscore');

var PropModule = function(options) {
    'use strict';

    var self = new Module();

    var type_map; // private variable used by self.typeMap

    initialize();

    function initialize() {
        self.type = 'undefined'; // Each plot must overwrite this to be their type, their type needs to be the same name as their file name

        self.name = 'undefined'; // Each plot must overwrite this to be their descriptive name (usually in their data file)

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
                'dispenser:dirt' : require('./prop/dispenser/dirt'),
                'item:dirt' : require('./prop/item/dirt')
            };
        }

        if(type) return type_map[type];
        return type_map;
    };

    // match a string to this object
    self.match = function(str) {
        var pattern = new RegExp(str, 'i');
        return pattern.test(self.type) || pattern.test(self.name);
    };

    return self;
};

module.exports = PropModule;
