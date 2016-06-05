'use strict';

const MessageTypes = require('telegram/types/message');
const Promise = require('bluebird');
const _ = require('lodash');

const Abstract = require('./_abstract');

class Verb extends Abstract {
    constructor(server, bot) {
        super(server, bot);

        let VerbsHelper = this.server.plugins.helpers.VerbsHelper;
        this.verbsHelper = new VerbsHelper(this.server.KB.VERBS);
    }

    process() {
        return Promise.coroutine(function *() {
            const { i18n } = this.chat;
            const locale = i18n.getLocale();

            this.query = this.query.toLowerCase();

            let text = '', options = {
                parse_mode: 'HTML',
                reply_markup: {
                    hide_keyboard: true
                }
            };

            if (_.has(this.server.KB.VERBS, this.query)) {
                let verb = this.server.KB.VERBS[this.query];
                text += i18n.__('Verb <code>%s</code>.\n\n', this.query);

                if (_.has(verb, 'case government')) {
                    text += `${i18n.__('Case government:')} \n`;

                    let i = 1;
                    _.forEach(_.get(verb, 'case government'), (value, key) => {
                        text += `${i}. <b>${key} + ${value.case}</b>`;

                        // translation
                        text += value.translation[locale] ? ` (${value.translation[locale]})` : '';
                        text += value.example ? `\n${i18n.__('<i>Example: %s</i>', value.example)}` : ``;
                        text += `\n`;

                        i++;
                    });
                }
            } else {
                let suggestions = this.verbsHelper.getVerbSuggestions(this.query);

                if (suggestions.length) {
                    text = i18n.__('We haven\'t found this verb, but these are alike:');
                    options = {
                        reply_markup: {
                            keyboard: ((suggestions) => {
                                let keyboard = [];
                                _.forEach(suggestions, (record) => {
                                    keyboard.push([record.key]);
                                });

                                return keyboard;
                            })(suggestions),
                            resize_keyboard: true,
                            one_time_keyboard: true
                        }
                    };
                } else {
                    text = i18n.__('Nothing was found');
                }
            }

            return [{ type: MessageTypes.MESSAGE, text: text, options: options }];
        }).bind(this)();
    }
}

module.exports = Verb;