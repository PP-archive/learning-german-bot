'use strict';

const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;
const Promise = require('bluebird');

module.exports = function (server, options) {
    let ChatsSchema = new Schema({
        chatId: Number,
        from: Schema.Types.Mixed,
        state: String,
        locale: String,
        startedAt: { type: Date, default: Date.now },
        finishedAt: { type: Date }
    });

    ChatsSchema.statics.STATES = {
        IDLE: 'IDLE',
        TRAINING: 'TRAINING'
    };

    ChatsSchema.methods.setState = function(state) {
        this.state = state;
        return this.save();
    }

    return ChatsSchema;
}