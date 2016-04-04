'use strict';

const Promise = require('bluebird');
const MessageTypes = require('types/message');

class Start {
    constructor(bot) {
        this.bot = bot;
    }
    
    process(query, message) {
        return Promise.coroutine(function *() {
            let chatId = message.chat.id;
            let Chats = this.bot.server.getModel('Chats');
            let chat = yield Chats.findOne({ chatId: chatId });

            if (!chat) {
                yield (new Chats({ chatId: chatId, from: message.from ,status: Chats.STATES.IDLE })).save();
            }

            return this.bot.commands.help.process();
        }).bind(this)();
    }
}

module.exports = function(bot) {
    return new Start(bot);
}