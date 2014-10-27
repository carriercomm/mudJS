// Dirt Dispenser template object

var Dispenser = require('../dispenser');

var DirtDispenser = function(options) {
    'use strict';

    var self = new Dispenser();

    initialize();

    function initialize() {
        self.type = 'dispenser:dirt'; // Each gameobject must overwrite this to be their type. Type is a colon separated string that describes the object type from general to specific

        self.name = 'Dirt'; // Each gameobject must overwrite this to be their descriptive name

        self.description = 'Plain ordinary dirt'; // Each gameobject should overwrite this

        _.extend(self, options);
    }

    return self;
};

module.exports = DirtDispenser;
