'use strict';

const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;
const Promise = require('bluebird');

module.exports = function (server, options) {
    let NotificationsMessagesSchema = new Schema({
        name: String,
        text: String,
        state: String,
        createdAt: {type: Date, default: Date.now },
        startedAt: { type: Date },
        finishedAt: { type: Date }
    });

    NotificationsMessagesSchema.statics.STATES = {
        CREATED: 'CREATED',
        IN_PROGRESS: 'IN_PROGRESS',
        FINISHED: 'FINISHED'
    };

    NotificationsMessagesSchema.methods.setState = function(state) {
        this.state = state;
        return this.save();
    }

    return NotificationsMessagesSchema;
}