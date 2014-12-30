// Get command

var Command     = require('../command'),
    PlaceModule = require('../place'),
    _           = require('underscore');

var GetCommand = function(world) {
    'use strict';

    var self = new Command();

    self.world = world;

    self.id = 'get';

    self.regex = new RegExp('^\\bget\\b');

    self.indexes = [
        'get'
    ];

    self.permissionGroups = [ 'character' ];

    self.help = {
        'title'    : 'Get',
        'header'   : 'Usage: {{ br() }}{{ tab() }}{{ tab() }}get {{ lt() }}object{{ gt() }}',
        'body'     : 'Pick up a specific object you can see in your current location.',
        'footer'   : ''
    };

    self.runCMD = function(args, callback) {

        new PlaceModule().findMe({ id: args.character.place() }, function(place) {
            if(args.words.length > 1) {
                var words = _.clone(args.words);

                words.shift();

                if(words[0] == 'the') words.shift();

                // search place for object to look at
                place.inventory(function(inventory) {

                    var handleSummary = function(output) {
                        callback({
                            'place'  : place.model.toObject(),
                            'object' : inventory[i],
                            'output' : output
                        });
                        return;
                    };

                    for(var i = 0; i < inventory.length; i++) {
                        if(inventory[i].prop.match(words[0])) {
                            console.log(inventory[i]);
                        }
                    }
                });
            }
            else {
                place.summary(function(output) {
                    callback({
                        'place'  : place.model.toObject(),
                        'output' : 'Specify an object to pick up.'
                    });
                });
            }
        });
    };

    return self;
};

module.exports = GetCommand;
