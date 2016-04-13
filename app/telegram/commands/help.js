'use strict';

const MessageTypes = require('telegram/types/message');
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
3. /training - тренируйся! Учим ТОП 200 слов либо управление глаголов.
4. /cancel - прервать тренировку
5. /help - расскажет как пользоваться ботом
6. /about - про бота в целом
7. /stats - статистика бота
8. /sources - исходный код бота`;

            return [{ type: MessageTypes.MESSAGE, text: text, options: options }];
        }).bind(this)();
    }
}

module.exports = function(bot) {
    return new Help(bot);
}