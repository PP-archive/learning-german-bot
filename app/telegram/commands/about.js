'use strict';

const MessageTypes = require('telegram/types/message');
const Promise = require('bluebird');
const _ = require('lodash');

const Abstract = require('./_abstract');

class About extends Abstract {
    constructor(server, bot) {
        super(server, bot);
    }

    process() {
        return Promise.coroutine(function *() {
            const { i18n } = this.chat;

            let text, options = {
                parse_mode: 'HTML',
                reply_markup: {
                    hide_keyboard: true
                }
            };

            text = `${i18n.__('Bot, who will help you to learn german.')}
${i18n.__('Send your suggestions to me@pavelpolyakov.com.')}
${i18n.__('Find out, who the bot is grateful to: /thanks.')}

${i18n.__('Rate the Bot:')}
https://telegram.me/storebot?start=LearningGermanBot`;


            return [{ type: MessageTypes.MESSAGE, text: text, options: options }];
        }).bind(this)();
    }
}

module.exports = About;