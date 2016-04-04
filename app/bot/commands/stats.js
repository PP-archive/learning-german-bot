'use strict';

const MessageTypes = require('types/message');
const Promise = require('bluebird');
const _ = require('lodash');
const fs = require('fs');

class Stats {
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

            text = `Статистика:
1. Глаголов в базе <i>${_.keys(this.bot.KB.VERBS).length}</i>
2. Топ 200: <i>${_.keys(this.bot.KB.TOP200).length}</i>`;

            // adding the lastupdate information, if available
            if (fs.existsSync('./.lastupdate')) {
                text += `\n3. Последнее обновление <i>${fs.readFileSync('./.lastupdate')}</i>`;
            }

            return [{ type: MessageTypes.MESSAGE, text: text, options: options }];
        }).bind(this)();
    }
}

module.exports = function(bot) {
    return new Stats(bot);
}