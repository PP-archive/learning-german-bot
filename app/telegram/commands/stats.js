'use strict';

const MessageTypes = require('telegram/types/message');
const Promise = require('bluebird');
const _ = require('lodash');
const fs = require('fs');

const Abstract = require('./_abstract');

class Stats extends Abstract {
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

            text = `${i18n.__('Statistics:')}
1. ${i18n.__('Verbs in the database: <i>%s</i>', _.keys(this.server.KB.VERBS).length)}
2. ${i18n.__('TOP 200: <i>%s</i>', _.keys(this.server.KB.TOP200).length)}
3. ${i18n.__('TOP 500 verbs: <i>%s</i>', _.keys(this.server.KB.TOP500_VERBS).length)}`;

            // adding the lastupdate information, if available
            if (fs.existsSync('./.lastupdate')) {
                text += `\n4. ${i18n.__('Last update at <i>%s</i>', fs.readFileSync('./.lastupdate'))}</i>`;
            }

            return [{ type: MessageTypes.MESSAGE, text: text, options: options }];
        }).bind(this)();
    }
}

module.exports = Stats;