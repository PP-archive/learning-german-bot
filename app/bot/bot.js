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

    /**
     * Gather the suggestions for the particular verb
     * @param query
     * @returns {*}
     * @private
     */
    _getVerbSuggestions(query) {
        query = query.toLowerCase();

        let distances = [];
        _.forEach(_.keys(this.KB.VERBS), (value) => {
            distances.push({ key: value, distance: (new Levenshtein(value, query)).distance });
        });

        let suggestions = _.chain(distances).filter((record) => {
            return record.distance <= 3;
        }).sortBy((record)=> {
            return record.key;
        }).value();

        return suggestions;
    }

    /**
     * Test if query looks like the verb
     * @param query
     * @returns {boolean}
     * @private
     */
    _testForVerb(query) {
        query = query.toLowerCase();

        if (_.has(this.KB.VERBS, query)) {
            return true;
        } else {
            let suggestions = this._getVerbSuggestions(query);

            return !!suggestions.length;
        }

        return false;
    }

    /**
     * Incapsulation of the command processors
     * @returns {Object}
     */
    get commands() {
        let self = this;
        return {
            start() {
              return self.commands.help();
            },
            verb(query) {
                query = query.toLowerCase();

                let response = '', options = {
                    parse_mode: 'HTML',
                    reply_markup: {
                        hide_keyboard: true
                    }
                };

                if (_.has(self.KB.VERBS, query)) {
                    let verb = self.KB.VERBS[query];
                    response += `Глагол <code>${query}</code>.\n\n`;

                    if (_.has(verb, 'case government')) {
                        response += `Управление: \n`;

                        let i = 1;
                        _.forEach(_.get(verb, 'case government'), (value, key) => {
                            response += `${i}. <b>${key} + ${value.case}</b>`;

                            // translation
                            response += value.translation ? ` (${value.translation})` : '';
                            response += value.example ? `\n<i>Пример: ${value.example}</i>` : ``;
                            response += `\n`;

                            i++;
                        });
                    }
                } else {
                    let suggestions = self._getVerbSuggestions(query);

                    if (suggestions.length) {
                        response = 'Мы не нашли такой глагол, но вот похожие';
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
                        response = 'Ничего не найдено';
                    }
                }

                return [response, options];
            },
            help() {
                let response, options = {
                    parse_mode: 'HTML',
                    reply_markup: {
                        hide_keyboard: true
                    }
                };

                response = `Пользоваться ботом можно так:
1. <code>[что-то]</code> - бот попробует сам догадаться о чем вы его спросили
2. /verb [глагол] - все про глагол
3. /help - расскажет как пользоваться ботом
4. /about - про бота в целом`;

                return [response, options];
            },
            about() {
                let response, options = {
                    parse_mode: 'HTML',
                    reply_markup: {
                        hide_keyboard: true
                    }
                };

                response = 'Бот который поможет вам в изучении немецкого. Пожелания отправляйте на me@pavelpolyakov.com .';

                return [response, options];
            }
        }
    }

    /**
     * Incoming messages processor
     * @param message
     * @returns []
     */
    process(message) {
        // In case incomming message is text one
        if (message.text) {
            let response = 'Ничего не найдено', options = {
                parse_mode: 'HTML',
                reply_markup: {
                    hide_keyboard: true
                }
            };

            let matches = message.text.match(/\/(.*?)(\s|$)(.*)/);

            // In case the message looks something like command
            if (matches) {
                let [,command,,query] = matches;

                // Trying to process the message, if such command is already defined
                if (_.isFunction(_.get(this, `commands.${command}`))) {
                    debug(`calling the command ${command}`);
                    return _.get(this, `commands.${command}`)(query);
                }
            }

            // If this was not a command, then we need to process it like regular query
            let query = message.text;

            // Test if query looks like the verb
            if(this._testForVerb(query)) {
                return _.get(this, 'commands.verb')(query);
            }

            return [response, options];
        }
    }
}

module.exports = new Bot();