'use strict';

const MessageTypes = require('telegram/types/message');
const Promise = require('bluebird');
const _ = require('lodash');

class Thanks {
    constructor(bot) {
        this.bot = bot;
    }

    process(query, message) {
        return Promise.coroutine(function *() {
            let text, options = {
                parse_mode: 'HTML',
                reply_markup: {
                    hide_keyboard: true
                }
            };

            text = `Используются материалы:
* http://www.de-online.ru/`;


            return [{ type: MessageTypes.MESSAGE, text: text, options: options }];
        }).bind(this)();
    }
}


module.exports = function(bot) {
    return new Thanks(bot);
}