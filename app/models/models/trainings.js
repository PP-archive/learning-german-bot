'use strict';

const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;

module.exports = function (server, options) {
    let TrainingsSchema = new Schema({
        chatId: Number,
        type: String,
        status: String,
        history: [Schema.Types.Mixed],
        startedAt: { type: Date, default: Date.now },
        finishedAt: { type: Date }
    });

    TrainingsSchema.statics.STATUSES = {
        IN_PROGRESS: 'IN_PROGRESS',
        FINISHED: 'FINISHED',
        CLOSED: 'CLOSED'
    };

    TrainingsSchema.statics.getActiveByChatId = function (chatId) {
        return this.findOne({ status: { $in: [this.STATUSES.IN_PROGRESS] }, chatId: chatId });
    }

    return TrainingsSchema;
}