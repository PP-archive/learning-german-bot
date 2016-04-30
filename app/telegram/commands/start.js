'use strict';

const Promise = require('bluebird');
const MessageTypes = require('telegram/types/message');

class Start {
    constructor(server) {
        this.server = server;
    }
    
    process(query, message) {
        return Promise.coroutine(function *() {
            let chatId = message.chat.id;
            let Chats = this.server.server.getModel('Chats');
            let chat = yield Chats.findOne({ chatId: chatId });

            if (!chat) {
                yield (new Chats({ chatId: chatId, from: message.from ,status: Chats.STATES.IDLE })).save();
            }

            return this.server.commands.help.process();
        }).bind(this)();
    }
}

module.exports = function(server, bot) {
    return new Start(server, bot);
}