'use strict';

const MessageTypes = require('telegram/types/message');
const Promise = require('bluebird');
const _ = require('lodash');

class About {
    constructor(server) {
        this.server = server;        
    }
    
    process(query, message) {
        return Promise.coroutine(function *() {
            let text, options = {
                parse_mode: 'HTML',
                reply_markup: {
                    hide_keyboard: true
                }
            };

            text = `Бот, который поможет вам в изучении немецкого.
Пожелания отправляйте на me@pavelpolyakov.com .
Узнайте, кому благодарен бот /thanks.

Оцените бота:
https://telegram.me/storebot?start=LearningGermanBot`;


            return [{ type: MessageTypes.MESSAGE, text: text, options: options }];
        }).bind(this)();
    }
}


module.exports = function(server, bot) {
    return new About(server, bot);
}