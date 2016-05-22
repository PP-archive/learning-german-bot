'use strict';

const MessageTypes = require('telegram/types/message');
const Promise = require('bluebird');
const _ = require('lodash');

class Abstract {
    constructor(server, bot) {
        this.server = server;
        this.bot = bot;

        this.models = {
            Chats: this.server.getModel('Chats'),
            Trainings: this.server.getModel('Trainings')
        };

        this.i18n = {};
    }

    _prepare(query, message) {
        return Promise.coroutine(function *() {
            this.query = query;
            this.message = message;

            // trick i18n with the empty headers
            this.server.i18n.init({ headers: {} }, this.i18n);

            let chatId = message.chat.id;
            let chat = yield this.models.Chats.findOne({ chatId: chatId });

            // set locale for the current request
            this.i18n.setLocale(chat.locale || 'ru-RU');
        }).bind(this)();
    }
}

module.exports = Abstract;