'use strict';

const MessageTypes = require('telegram/types/message');
const Promise = require('bluebird');
const _ = require('lodash');

const Abstract = require('./_abstract');

class Cancel extends Abstract {
    constructor(server, bot) {
        super(server, bot);
    }

    process({ chat, query, message }) {
        return Promise.coroutine(function *() {
            const { i18n } = this.chat;

            const { Chats, Trainings } = this.models;

            yield this.chat.setState(Chats.STATES.IDLE);

            yield Trainings.update({ chatId: this.message.chat.id, status: Trainings.STATUSES.IN_PROGRESS }, {
                status: Trainings.STATUSES.CLOSED,
                finishedAt: new Date()
            });

            let text = i18n.__('Done!');
            let options = {
                parse_mode: 'HTML',
                reply_markup: {
                    hide_keyboard: true
                }
            };

            return [{ type: MessageTypes.MESSAGE, text: text, options: options }];
        }).bind(this)();
    }
}

module.exports = Cancel;