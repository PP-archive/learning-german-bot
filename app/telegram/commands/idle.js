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

    process() {
        return Promise.coroutine(function *() {
            const { i18n } = this.chat;

            let text = i18n.__('Nothing was found'), options = {
                parse_mode: 'HTML',
                reply_markup: {
                    hide_keyboard: true
                }
            };

            // Test if query looks like the verb
            if (this.verbsHelper.testForVerb(this.query)) {
                let call = {
                    command: undefined,
                    class: undefined,
                    data: {
                        chat: this.chat,
                        query: this.query,
                        message: this.message
                    }
                };

                call.class = _.get(this.bot, `commands.verb`);
                let command = new call.class(this.server, this.bot);
                command.init(call.data);

                return yield command.process();
            }

            return [{ type: MessageTypes.MESSAGE, text: text, options: options }];
        }).bind(this)();
    }
}

module.exports = Idle;