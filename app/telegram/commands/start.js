'use strict';

const Promise = require('bluebird');
const MessageTypes = require('telegram/types/message');

const Abstract = require('./_abstract');

class Start extends Abstract {
    constructor(server, bot) {
        super(server, bot);
    }

    process({ chat, query, message }) {
        return super.process({ chat, query, message }).then(
            Promise.coroutine(function *() {
                const { Chats } = this.models;

                if (!this.chat) {
                    yield (new Chats({
                        chatId: this.message.chat.id,
                        from: this.message.from,
                        status: Chats.STATES.IDLE,
                        locale: 'en-US'
                    })).save();
                }

                let r = (yield (new this.bot.commands.help(this.server, this.bot)).process({ chat, query, message }));

                return r;
            }).bind(this));
    }
}

module.exports = Start;