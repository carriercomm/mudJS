// Dirt Item template object

var Item = require('../item');

var DirtItem = function(options) {
    'use strict';

    var self = new Item();

    initialize();

    function initialize() {
        self.type = 'item:dirt'; // Each gameobject must overwrite this to be their type. Type is a colon separated string that describes the object type from general to specific

        self.name = 'Dirt'; // Each gameobject must overwrite this to be their descriptive name

        self.description = 'Plain ordinary dirt'; // Each gameobject should overwrite this

        _.extend(self, options);
    }

    return self;
};

module.exports = DirtItem;
