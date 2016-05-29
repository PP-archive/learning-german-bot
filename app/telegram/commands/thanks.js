'use strict';

const MessageTypes = require('telegram/types/message');
const Promise = require('bluebird');
const _ = require('lodash');

const Abstract = require('./_abstract');

class Thanks extends Abstract {
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

            text = `${i18n.__('Used materials from:')}
* http://www.de-online.ru/`;


            return [{ type: MessageTypes.MESSAGE, text: text, options: options }];
        }).bind(this)();
    }
}


module.exports = Thanks;