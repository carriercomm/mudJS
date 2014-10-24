// GameObject - a game object in the game

var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    Mixed = mongoose.Schema.Types.Mixed;

var GameObject = new Schema({
    type        : { type: String, required: true }
});

module.exports = mongoose.model('GameObject', GameObject);
