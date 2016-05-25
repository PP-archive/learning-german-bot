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
    }

    init({chat, query, message}) {
       return Promise.coroutine(function *() {
           this.chat = chat;
           this.query = query;
           this.message = message;
       }).bind(this)();
    }
}

module.exports = Abstract;