'use strict';

const MessageTypes = require('telegram/types/message');
const Promise = require('bluebird');
const _ = require('lodash');

const Abstract = require('./_abstract');

class Sources extends Abstract {
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

            text = `${i18n.__('Source code:')} https://github.com/PavelPolyakov/learning-german-server.`;

            return [{ type: MessageTypes.MESSAGE, text: text, options: options }];
        }).bind(this)();
    }
}


module.exports = Sources;