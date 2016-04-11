'use strict';

const MessageTypes = require('bot/types/message');
const Promise = require('bluebird');
const _ = require('lodash');

const VerbsHelper = require('helpers/verbs');

class Verb {
    constructor(bot) {
        this.bot = bot;
        
        this.verbsHelper = new VerbsHelper(this.bot.KB.VERBS);
    }

    process(query, message) {
        return Promise.coroutine(function *() {
            query = query.toLowerCase();

            let text = '', options = {
                parse_mode: 'HTML',
                reply_markup: {
                    hide_keyboard: true
                }
            };

            if (_.has(this.bot.KB.VERBS, query)) {
                let verb = this.bot.KB.VERBS[query];
                text += `Глагол <code>${query}</code>.\n\n`;

                if (_.has(verb, 'case government')) {
                    text += `Управление: \n`;

                    let i = 1;
                    _.forEach(_.get(verb, 'case government'), (value, key) => {
                        text += `${i}. <b>${key} + ${value.case}</b>`;

                        // translation
                        text += value.translation ? ` (${value.translation})` : '';
                        text += value.example ? `\n<i>Пример: ${value.example}</i>` : ``;
                        text += `\n`;

                        i++;
                    });
                }
            } else {
                let suggestions = this.verbsHelper.getVerbSuggestions(query);

                if (suggestions.length) {
                    text = 'Мы не нашли такой глагол, но вот похожие';
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
                    text = 'Ничего не найдено';
                }
            }

            return [{ type: MessageTypes.MESSAGE, text: text, options: options }];
        }).bind(this)();
    }
}


module.exports = function(bot) {
    return new Verb(bot);
}