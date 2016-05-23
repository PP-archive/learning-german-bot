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

    ChatsSchema.post('init', function(doc, next) {
        return Promise.coroutine(function *() {
            if(!doc) {
                return next();
            }
            // defining the locale
            // trick i18n with the empty headers
            this.i18n = {};
            server.i18n.init({ headers: {} }, this.i18n);
            this.i18n.setLocale(this.locale || 'ru-RU');

            return next();
        }).bind(this)();
    });

    ChatsSchema.methods.setState = function (state) {
        this.state = state;
        return this.save();
    }

    return ChatsSchema;
}