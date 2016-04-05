'use strict';

const MessageTypes = require('types/message');
const Promise = require('bluebird');
const _ = require('lodash');

class About {
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

            text = `Бот, который поможет вам в изучении немецкого.
Пожелания отправляйте на me@pavelpolyakov.com .
Узнайте, кому благодарен бот /thanks.

Оцените бота:
https://telegram.me/storebot?start=LearningGermanBot`;


            return [{ type: MessageTypes.MESSAGE, text: text, options: options }];
        }).bind(this)();
    }
}


module.exports = function(bot) {
    return new About(bot);
}