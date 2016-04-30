'use strict';

const MessageTypes = require('telegram/types/message');
const Promise = require('bluebird');
const _ = require('lodash');
const fs = require('fs');

class Stats {
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

            text = `Статистика:
1. Глаголов в базе <i>${_.keys(this.server.KB.VERBS).length}</i>
2. Топ 200: <i>${_.keys(this.server.KB.TOP200).length}</i>
3. Топ 500 глаголов: <i>${_.keys(this.server.KB.TOP500_VERBS).length}</i>`;

            // adding the lastupdate information, if available
            if (fs.existsSync('./.lastupdate')) {
                text += `\n4. Последнее обновление <i>${fs.readFileSync('./.lastupdate')}</i>`;
            }

            return [{ type: MessageTypes.MESSAGE, text: text, options: options }];
        }).bind(this)();
    }
}

module.exports = function(server, bot) {
    return new Stats(server, bot);
}