// Store for all models

var models = {
    character  : require('./models/character'),
    gameobject : require('./models/gameobject'),
    gate       : require('./models/gate'),
    place      : require('./models/place'),
    region     : require('./models/region'),
    session    : require('./models/session'),
    user       : require('./models/user')
};

module.exports = models;
