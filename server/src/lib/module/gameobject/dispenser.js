// Dispenser Game Object template object

var GameObject = require('../gameobject');

var DispenserGameObject = function(options) {
    'use strict';

    var self = new GameObject();

    initialize();

    function initialize() {
        self.type = 'dispenser'; // Each gameobject must overwrite this to be their type. Type is a colon separated string that describes the object type from general to specific

        self.name = 'Dispenser'; // Each gameobject must overwrite this to be their descriptive name

        self.description = 'Generic Dispenser'; // Each gameobject should overwrite this
        
        self.templateItem = require('./item'); // Each dispenser should overwrite this to require in the correct item to dispense

        _.extend(self, options);
    }
    
    return self;
};

module.exports = DispenserGameObject;
