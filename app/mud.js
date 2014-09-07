// Entry point to mud server

var MUD = (function() {
    var self = this;

    initialize();

    function initialize() {
        self.login = require('./mud/login');
        self.world = require('./mud/world');
    }

    return self;
});

module.exports = new MUD();