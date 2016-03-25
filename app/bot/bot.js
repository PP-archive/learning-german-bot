'use strict';

const _ = require('lodash');
const yaml = require('js-yaml');
const fs = require('fs');
const Levenshtein = require('levenshtein');
const debug = require('debug')('Bot');

class Bot {
    constructor() {
        this.KB = {};
        this.KB.VERBS = yaml.safeLoad(fs.readFileSync('./kb/verbs.yaml', 'utf8'));
    }

    get commands() {
        let self = this;
        return {
            verb(query) {
                let response = '';
                if (_.has(self.KB.VERBS, query)) {
                    let verb = self.KB.VERBS[query];
                    response += `Глагол <code>${query}</code>.\n\n`;

                    if (_.has(verb, 'case government')) {
                        response += `Управление: \n`;

                        let i = 1;
                        _.forEach(_.get(verb, 'case government'), (value, key) => {
                            response += `${i}. <b>${key}</b>`;

                            // translation
                            response += value.translation ? ` (${value.translation})` : '';
                            response += value.example ? `\n<i>Пример: ${value.example}</i>` : ``;
                            response += `\n`;

                            i++;
                        });
                    }
                } else {
                    response = `Увы, глагола <code>${query}</code> не найдено`;
                }

                return [response, {
                    parse_mode: 'HTML',
                    reply_markup: {
                        hide_keyboard: true
                    }
                }];
            }
        }
    }

    process(message) {
        /**
         * In case incomming message is text one
         */
        if (message.text) {
            let matches = message.text.match(/\/(.*?)(\s|$)(.*)/);

            /**
             * In case the message looks something like command
             */
            if (matches) {
                let [,command,,query] = matches;

                /**
                 * Trying to process the message, if such command is already defined
                 */
                if (_.isFunction(_.get(this, `commands.${command}`))) {
                    debug(`calling the command ${command}`);
                    return _.get(this, `commands.${command}`)(query);
                }
            }

            /**
             * Trying to find the most similar verb
             */
            if (_.has(this.KB.VERBS, message.text)) {
                return _.get(this, 'commands.verb')(message.text);
            } else {
                let distances = [];
                _.forEach(_.keys(this.KB.VERBS), (value) => {
                    distances.push({ key: value, distance: (new Levenshtein(value, message.text)).distance });
                });

                let suggestions = _.chain(distances).filter((record) => {
                    return record.distance <= 3;
                }).sortBy((record)=> {
                    return record.key;
                }).value();

                if (suggestions.length) {
                    return ['Мы не нашли такой глагол, но вот похожие', {
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
                    }];
                } else {
                    return [`Что-то ничего вообще не нашлось \u{1F604}`];
                }
            }
        }
    }
}

module.exports = new Bot();