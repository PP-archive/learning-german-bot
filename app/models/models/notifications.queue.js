'use strict';

const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;
const Promise = require('bluebird');

module.exports = function (server, options) {
    let NotificationQueueSchema = new Schema({
        messageId: Number,
        chatId: String,
        state: String,
        createdAt: {type: Date, default: Date.now },
        sentAt: { type: Date }
    });

    NotificationQueueSchema.statics.STATES = {
        CREATED: 'CREATED',
        FINISHED: 'SENT'
    };

    NotificationQueueSchema.methods.setState = function(state) {
        this.state = state;
        return this.save();
    }

    return NotificationQueueSchema;
}