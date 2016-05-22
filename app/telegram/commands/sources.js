'use strict';

const MessageTypes = require('telegram/types/message');
const Promise = require('bluebird');
const _ = require('lodash');

const Abstract = require('./_abstract');

class Sources extends Abstract {
    constructor(server, bot) {
        super(server, bot);
    }

    process(query, message) {
        return Promise.coroutine(function *() {
            let text, options = {
                parse_mode: 'HTML',
                reply_markup: {
                    hide_keyboard: true
                }
            };

            text = `Исходники бота: https://github.com/PavelPolyakov/learning-german-server .`;

            return [{ type: MessageTypes.MESSAGE, text: text, options: options }];
        }).bind(this)();
    }
}


module.exports = Sources;