const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;

module.exports = function(server, options) {
    return new Schema({
        chatId: Number,
        type: String,
        status: String,
        history: [Schema.Types.Mixed],
        startedAt: { type: Date, default: Date.now },
        finishedAt: { type: Date }
    });
}