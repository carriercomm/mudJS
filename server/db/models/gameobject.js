// GameObject - a game object in the game

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    Mixed = mongoose.Schema.Types.Mixed;

var GameObject = new Schema({
    type        : { type: String, required: true },
    place       : { type: Schema.ObjectId, ref: 'Place' }, // The place (if any) that has this game object
    character   : { type: Schema.ObjectId, ref: 'Character' }, // The character (if any) that has this game object
    container   : { type: Schema.ObjectId, ref: 'GameObject' }, // The game object (if any) that has this game object
    inventory   : [{ type: Schema.ObjectId, ref: 'GameObject' }] // Items can potentially hold other items
});

module.exports = mongoose.model('GameObject', GameObject);
