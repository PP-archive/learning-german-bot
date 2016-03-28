'use strict';

const _ = require('lodash');
const yaml = require('js-yaml');
const fs = require('fs');
const Levenshtein = require('levenshtein');
const debug = require('debug')('bot');
const config = require('config');

// telegram bot
const TelegramBot = require('node-telegram-bot-api');
let telegramBot = new TelegramBot(config.get('tokens.telegram'));
const botan = require('botanio')(config.get('tokens.botan'));

let url = config.get('baseUrl');
let crt = config.has('crt') ? config.get('crt') : undefined;

debug(`Setting the webHook: url: ${url}, crt: ${crt}`);
telegramBot.setWebHook(url, crt);

module.exports = function (server, options) {

    class Bot {
        get TYPES() {
            return {
                MESSAGE: 'MESSAGE',
                PHOTO: 'PHOTO'
            }
        }

        /**
         * constructor
         * @param bot
         * @param botan
         */
        constructor(bot, botan) {
            this.KB = {};
            this.KB.VERBS = yaml.safeLoad(fs.readFileSync('./kb/verbs.yaml', 'utf8'));

            this.bot = bot;
            this.botan = botan;

            // making the processUpdate method public
            this.processUpdate = this.bot.processUpdate;

            // receiving each message
            this.bot.on('message', (message) => {
                debug('sending the message to botan');
                // setting up the tracking by botan
                this.botan.track(message);

                const chatId = message.chat.id;

                // processing the message
                _.forEach(this.process(message), (reply) => {
                    console.log('---');
                    console.log(reply);
                    console.log('---');
                    switch (reply.type) {
                        case this.TYPES.MESSAGE:
                            this.bot.sendMessage(chatId, reply.text, reply.options || {});
                            break;
                        default:
                            debug('Undefined')
                            break;
                    }
                });
            });
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
                // in case it's not one word
                if (value.indexOf(' ') !== -1) {
                    let words = value.split(' ');
                    // find the min distance all in all
                    let distance = _(words)
                        .map((word) => {
                            return (new Levenshtein(word, query)).distance
                        })
                        .push((new Levenshtein(value, query)).distance)
                        .min();

                    distances.push({ key: value, distance: distance });
                } else {
                    distances.push({ key: value, distance: (new Levenshtein(value, query)).distance });
                }
            });

            let suggestions = _(distances)
                .filter((record) => {
                    return record.distance <= 3;
                })
                .sortBy((record)=> {
                    return record.distance;
                })
                .slice(0, 5)
                .sortBy((record)=> {
                    return record.key;
                })
                .value();

            return suggestions;
        }

        _testForTrainingSelection() {
            return true;
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
                train() {

                },
                verb(query) {
                    query = query.toLowerCase();

                    let text = '', options = {
                        parse_mode: 'HTML',
                        reply_markup: {
                            hide_keyboard: true
                        }
                    };

                    if (_.has(self.KB.VERBS, query)) {
                        let verb = self.KB.VERBS[query];
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
                        let suggestions = self._getVerbSuggestions(query);

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

                    return [{ type: self.TYPES.MESSAGE, text: text, options: options }];
                },
                help() {
                    let text, options = {
                        parse_mode: 'HTML',
                        reply_markup: {
                            hide_keyboard: true
                        }
                    };

                    text = `Пользоваться ботом можно так:
1. <code>[что-то]</code> - бот попробует сам догадаться о чем вы его спросили. Например: <pre>sprechen</pre>.
2. /verb [глагол] - все про глагол. Например: <pre>/verb sprechen</pre>.
3. /help - расскажет как пользоваться ботом
4. /about - про бота в целом
5. /stats - статистика бота`;

                    return [{ type: self.TYPES.MESSAGE, text: text, options: options }];
                },
                about() {
                    let text, options = {
                        parse_mode: 'HTML',
                        reply_markup: {
                            hide_keyboard: true
                        }
                    };

                    text = `Бот который поможет вам в изучении немецкого.
Пожелания отправляйте на me@pavelpolyakov.com .
Исходники бота: https://github.com/PavelPolyakov/learning-german-bot`;

                    return [{ type: self.TYPES.MESSAGE, text: text, options: options }];
                },
                stats() {
                    let text, options = {
                        parse_mode: 'HTML',
                        reply_markup: {
                            hide_keyboard: true
                        }
                    };

                    text = `Статистика:
1. Глаголов в базе <i>${_.keys(self.KB.VERBS).length}</i>`;

                    // adding the lastupdate information, if available
                    if (fs.existsSync('./.lastupdate')) {
                        text += `\n2. Последнее обновление <i>${fs.readFileSync('./.lastupdate')}</i>`;
                    }

                    return [{ type: self.TYPES.MESSAGE, text: text, options: options }];
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
                let text = 'Ничего не найдено', options = {
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
                if (this._testForVerb(query)) {
                    return _.get(this, 'commands.verb')(query);
                }

                return [{ type: this.TYPES.MESSAGE, text: text, options: options }];
            }
        }
    }

    return new Bot(telegramBot, botan);
}