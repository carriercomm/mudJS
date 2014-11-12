// Look command

var Command     = require('../command'),
    PlaceModule = require('../place'),
    _           = require('underscore');

var LookCommand = function(world) {
    'use strict';

    var self = new Command();

    self.world = world;

    self.id = 'look';

    self.regex = new RegExp('^\\blook\\b');

    self.indexes = [
        'look'
    ];

    self.permissionGroups = [ 'character' ];

    self.help = {
        'title'    : 'Look',
        'header'   : 'Usage: {{ br() }}{{ tab() }}{{ tab() }}look {{ br() }}{{ tab() }}{{ tab() }}look {{ lt() }}object{{ gt() }} {{ br() }}{{ tab() }}{{ tab() }}look at {{ lt() }}object{{ gt() }} {{ br() }}{{ tab() }}{{ tab() }}look at the {{ lt() }}object{{ gt() }}',
        'body'     : 'Look around your current location or look at a specific object you can see in that location.',
        'footer'   : ''
    };

    self.runCMD = function(args, callback) {

        new PlaceModule().findMe({ id: args.character.place() }, function(place) {
            if(args.words.length > 1) {
                var words = _.clone(args.words);

                words.shift();

                if(words[0] == 'at') words.shift();

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
                            inventory[i].summary(handleSummary);
                        }
                    }
                });
            }
            else {
                place.summary(function(output) {
                    callback({
                        'place'  : place.model.toObject(),
                        'output' : output
                    });
                });
            }
        });
    };

    return self;
};

module.exports = LookCommand;
