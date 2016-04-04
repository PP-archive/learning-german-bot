'use strict';

const MessageTypes = require('types/message');
const Promise = require('bluebird');

class Help {
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

            text = `Пользоваться ботом можно так:
1. <code>[что-то]</code> - бот попробует сам догадаться о чем вы его спросили. Например: <pre>sprechen</pre>.
2. /verb [глагол] - все про глагол. Например: <pre>/verb sprechen</pre>.
3. /help - расскажет как пользоваться ботом
4. /about - про бота в целом
5. /stats - статистика бота`;

            return [{ type: MessageTypes.MESSAGE, text: text, options: options }];
        }).bind(this)();
    }
}

module.exports = function(bot) {
    return new Help(bot);
}