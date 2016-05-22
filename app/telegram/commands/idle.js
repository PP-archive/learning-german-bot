'use strict';

const MessageTypes = require('telegram/types/message');
const Promise = require('bluebird');
const _ = require('lodash');

const Abstract = require('./_abstract');
class Idle extends Abstract {
    constructor(server, bot) {
        super(server, bot);

        let VerbsHelper = this.server.plugins.helpers.VerbsHelper;

        this.verbsHelper = new VerbsHelper(this.server.KB.VERBS);
    }

    process(query, message) {
        return Promise.coroutine(function *() {
            let text = 'Ничего не найдено', options = {
                parse_mode: 'HTML',
                reply_markup: {
                    hide_keyboard: true
                }
            };

            // Test if query looks like the verb
            if (this.verbsHelper.testForVerb(query)) {
                return _.get(this.bot, 'commands.verb').process(query, message);
            }

            return [{ type: MessageTypes.MESSAGE, text: text, options: options }];
        }).bind(this)();
    }
}

module.exports = Idle;