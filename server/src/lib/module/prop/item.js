// Generic Item Prop template object

var Prop = require('../prop'),
    _    = require('underscore');

var ItemProp = function(options) {
    'use strict';

    var self = new Prop();

    initialize();

    function initialize() {
        self.type = 'item'; // Each gameobject must overwrite this to be their type. Type is a colon separated string that describes the object type from general to specific

        self.name = 'Item'; // Each gameobject must overwrite this to be their descriptive name

        self.description = 'Generic Item'; // Each gameobject should overwrite this

        _.extend(self, options);
    }

    return self;
};

module.exports = ItemProp;
