'use strict';

const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;
const Promise = require('bluebird');

module.exports = function (server, options) {
    let NotificationQueueSchema = new Schema({
        _message: {type: Schema.Types.ObjectId, ref: 'notifications.messages'},
        chatId: Number,
        state: String,
        exceptions: [String],
        createdAt: {type: Date, default: Date.now },
        sentAt: { type: Date }
    });

    NotificationQueueSchema.statics.STATES = {
        CREATED: 'CREATED',
        SENT: 'SENT',
        EXCEPTION: 'EXCEPTION'
    };

    NotificationQueueSchema.methods.setState = function(state) {
        this.state = state;
        return this.save();
    }

    return NotificationQueueSchema;
}