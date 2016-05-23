'use strict';

const MessageTypes = require('telegram/types/message');
const Promise = require('bluebird');
const _ = require('lodash');

const Abstract = require('./_abstract');

class Thanks extends Abstract {
    constructor(server, bot) {
        super(server, bot);
    }

    process({ chat, query, message }) {
        return super.process({ chat, query, message }).then(
            Promise.coroutine(function *() {

                let text, options = {
                    parse_mode: 'HTML',
                    reply_markup: {
                        hide_keyboard: true
                    }
                };

                text = `Используются материалы:
* http://www.de-online.ru/`;


                return [{ type: MessageTypes.MESSAGE, text: text, options: options }];
            }).bind(this));
    }
}


module.exports = Thanks;