'use strict';

const Promise = require('bluebird');
const MessageTypes = require('telegram/types/message');

const Abstract = require('./_abstract');

class Start extends Abstract {
    constructor(server, bot) {
        super(server, bot);
    }

    process(query, message) {
        return Promise.coroutine(function *() {
            const Chats = this.server.server.getModel('Chats');
            let chatId = message.chat.id;
            let chat = yield Chats.findOne({ chatId: chatId });

            if (!chat) {
                yield (new Chats({
                    chatId: chatId,
                    from: message.from,
                    status: Chats.STATES.IDLE,
                    locale: 'en-US'
                })).save();
            }

            return this.bot.commands.help.process();
        }).bind(this)();
    }
}

module.exports = Start;