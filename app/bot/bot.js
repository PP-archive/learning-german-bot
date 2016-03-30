'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const yaml = require('js-yaml');
const fs = require('fs');
const Levenshtein = require('levenshtein');
const debug = require('debug')('bot');
const config = require('config');
const emoji = require('node-emoji');

// telegram bot preparation
const TelegramBot = require('node-telegram-bot-api');
let telegramBot = new TelegramBot(config.get('tokens.telegram'));
let url = config.get('baseUrl');
let crt = config.has('crt') ? config.get('crt') : undefined;

debug(`Setting the webHook: url: ${url}, crt: ${crt}`);
telegramBot.setWebHook(url, crt);

// init of the botan analytics
const botan = require('botanio')(config.get('tokens.botan'));

// defines
const MessageTypes = require('./message-types');

module.exports = function (server, options) {

    class Bot {
        /**
         * constructor
         * @param bot
         * @param botan
         */
        constructor(bot, botan) {
            this.KB = {};
            this.KB.VERBS = yaml.safeLoad(fs.readFileSync('./kb/verbs.yaml', 'utf8'));

            // load trainings
            let trainingsPath = __dirname + '/trainings';
            this.trainings = {};
            fs.readdirSync(trainingsPath).forEach((value) => {
                if (fs.lstatSync(trainingsPath + '/' + value).isFile() && (value.charAt(0) !== '_')) {

                    let file = value;

                    /*Get model name for Sequalize from file name*/
                    let training = require('./trainings/' + file)(this.KB);

                    if (training.ACTIVE) {
                        this.trainings[training.TYPE] = training;
                    }
                }
            });

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
                this.process(message).then((messages) => {
                    let i = 0;
                    _.forEach(messages, (reply) => {
                        setTimeout(() => {
                            switch (reply.type) {
                                case MessageTypes.MESSAGE:
                                    console.log(`[${reply.text}]`);
                                    this.bot.sendMessage(chatId, reply.text, reply.options || {});
                                    break;
                                default:
                                    debug('Undefined')
                                    break;
                            }
                        }, 300 * i);

                        i++;
                    });
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
            return {
                start: (query, message) => {
                    return Promise.coroutine(function *() {
                        let chatId = message.chat.id;
                        let Chats = server.getModel('Chats');
                        let chat = yield Chats.findOne({ chatId: chatId });

                        if (!chat) {
                            yield (new Chats({ chatId: chatId, status: Chats.STATES.IDLE })).save();
                        }

                        return this.commands.help();
                    }).bind(this)();
                },
                cancel: (query, message) => {
                    return Promise.coroutine(function *() {
                        let Chats = server.getModel('Chats');
                        let chat = yield Chats.findOne({ chatId: message.chat.id });
                        chat.state = Chats.STATES.IDLE;
                        chat.save();

                        let Trainings = server.getModel('Trainings');
                        Trainings.update({ chatId: message.chat.id }, {
                            status: Trainings.STATUSES.CLOSED,
                            finishedAt: new Date()
                        });

                        let text = 'Сделано! Теперь с чистого листа.';
                        let options = {
                            parse_mode: 'HTML',
                            reply_markup: {
                                hide_keyboard: true
                            }
                        };

                        return [{ type: MessageTypes.MESSAGE, text: text, options: options }];
                    }).bind(this)();
                },
                training: (query, message) => {
                    return Promise.coroutine(function *() {
                        if (!query) {
                            let Chats = server.getModel('Chats');
                            let chat = yield Chats.findOne({ chatId: message.chat.id });

                            let text, options;

                            // in case user is not yet registered
                            if (!chat) {
                                text = `По какой-то причине вы еще не зарегистриованы. Вы можете зарегистрироваться этой командой: /start`;
                                return [{ type: MessageTypes.MESSAGE, text: text }];
                            }

                            chat.setState(Chats.STATES.TRAINING);

                            text = `Выберите тип тренировки:\n`;

                            let i = 1;
                            _.forEach(this.trainings, (training) => {
                                text += `${i}. <code>${training.LABEL}</code> - ${training.DESCRIPTION}\n`;
                                i++;
                            });

                            text += `\nЕсли хотите прервать - /cancel\n`;

                            options = {
                                parse_mode: 'HTML',
                                reply_markup: {
                                    keyboard: (() => {
                                        let keyboard = [];
                                        _.forEach(this.trainings, (training) => {
                                            keyboard.push([training.LABEL]);
                                        });

                                        return keyboard;
                                    })(),
                                    resize_keyboard: true,
                                    one_time_keyboard: true
                                }
                            };

                            return [{ type: MessageTypes.MESSAGE, text: text, options: options }];
                        } else {
                            let Trainings = server.getModel('Trainings');
                            let activeTraining = yield Trainings.getActiveByChatId(message.chat.id);

                            // probably this should be an attempt to choose the training
                            if (!activeTraining) {
                                let trainingModel = _.find(this.trainings, (training, key) => {
                                    return query === training.LABEL;
                                });

                                if (trainingModel) {
                                    let messages = [];

                                    // initial message
                                    messages.push({
                                        type: MessageTypes.MESSAGE,
                                        text: `Начинаем тренировку <code>${trainingModel.LABEL}</code>, вас ждет ${trainingModel.ITERATIONS} заданий.`,
                                        options: {
                                            parse_mode: 'HTML',
                                            reply_markup: {
                                                hide_keyboard: true
                                            }
                                        }
                                    });

                                    let training = new Trainings({
                                        chatId: message.chat.id,
                                        type: trainingModel.TYPE,
                                        status: Trainings.STATUSES.IN_PROGRESS
                                    });
                                    training.save();

                                    // now we need to get the first task
                                    let task = trainingModel.getTask(training.history);

                                    messages = _.union(messages, task.messages);

                                    console.log('---');
                                    console.log(messages);
                                    console.log('---');

                                    training.history.push({
                                        question: task.question,
                                        variants: task.variants,
                                        answer: task.answer,
                                        result: undefined
                                    });
                                    training.save();

                                    //messages
                                    return messages;
                                } else {
                                    let text = `Увы такой тренировки мы не нашли, попробуйте еще разок. Либо /cancel, чтобы прервать эту операцию.`;
                                    return [{ type: MessageTypes.MESSAGE, text: text }];
                                }
                            } else {
                                let messages = [];
                                let trainingModel = _.find(this.trainings, (training, key) => {
                                    return activeTraining.type = training.TYPE;
                                });

                                let lastQuestion = activeTraining.history.pop();

                                let result = trainingModel.validateAnswer(lastQuestion, query);
                                lastQuestion.result = result;

                                activeTraining.history.push(lastQuestion);
                                activeTraining.save();

                                if (result) {
                                    messages.push({
                                        type: MessageTypes.MESSAGE,
                                        text: `${emoji.get(':white_check_mark:')} верно!`
                                    });
                                } else {
                                    messages.push({
                                        type: MessageTypes.MESSAGE,
                                        text: `${emoji.get(':x:')} не очень верно :(`
                                    });
                                }


                                if (activeTraining.history.length < trainingModel.ITERATIONS) {
                                    // now we need to get the first task
                                    let task = trainingModel.getTask(activeTraining.history);

                                    activeTraining.history.push({
                                        question: task.question,
                                        variants: task.variants,
                                        answer: task.answer,
                                        result: undefined
                                    });
                                    activeTraining.save();

                                    messages = _.union(messages, task.messages);

                                    console.log('---');
                                    console.log(messages);
                                    console.log('---');
                                } else {
                                    let correctResults = _.reduce(activeTraining.history, function (sum, object) {
                                        return sum + (object.result ? 1 : 0);
                                    }, 0);

                                    let text = `Тренировочка закончена, вы большой молодец: ${correctResults} из ${trainingModel.ITERATIONS}!`;

                                    messages.push({
                                        type: MessageTypes.MESSAGE,
                                        text: text
                                    });

                                    let Chats = server.getModel('Chats');
                                    let chat = yield Chats.findOne({ chatId: message.chat.id });

                                    activeTraining.status = Trainings.STATUSES.FINISHED;
                                    activeTraining.finishedAt = new Date();
                                    activeTraining.save();

                                    chat.state = Chats.STATES.IDLE;
                                    chat.save();
                                }

                                return messages;
                            }
                        }
                    }).bind(this)();
                },
                verb: (query) => {
                    return Promise.coroutine(function *() {
                        query = query.toLowerCase();

                        let text = '', options = {
                            parse_mode: 'HTML',
                            reply_markup: {
                                hide_keyboard: true
                            }
                        };

                        if (_.has(this.KB.VERBS, query)) {
                            let verb = this.KB.VERBS[query];
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
                            let suggestions = this._getVerbSuggestions(query);

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
                },
                help: () => {
                    return Promise.coroutine(function *() {
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

                        return [{ type: MessageTypes.MESSAGE, text: text, options: options }];
                    }).bind(this)();
                },
                about: () => {
                    return Promise.couroutine(function *() {
                        let text, options = {
                            parse_mode: 'HTML',
                            reply_markup: {
                                hide_keyboard: true
                            }
                        };

                        text = `Бот который поможет вам в изучении немецкого.
Пожелания отправляйте на me@pavelpolyakov.com .
Исходники бота: https://github.com/PavelPolyakov/learning-german-bot`;

                        return [{ type: MessageTypes.MESSAGE, text: text, options: options }];
                    }).bind(this)();
                },
                stats: () => {
                    return Promise.coroutine(function *() {
                        let text, options = {
                            parse_mode: 'HTML',
                            reply_markup: {
                                hide_keyboard: true
                            }
                        };

                        text = `Статистика:
1. Глаголов в базе <i>${_.keys(this.KB.VERBS).length}</i>`;

                        // adding the lastupdate information, if available
                        if (fs.existsSync('./.lastupdate')) {
                            text += `\n2. Последнее обновление <i>${fs.readFileSync('./.lastupdate')}</i>`;
                        }

                        return [{ type: MessageTypes.MESSAGE, text: text, options: options }];
                    }).bind(this)();
                }
            }
        }

        /**
         * Incoming messages processor
         * @param message
         * @returns []
         */
        process(message) {
            return Promise.coroutine(function *() {
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
                            return _.get(this, `commands.${command}`)(query, message);
                        }
                    }

                    // If this was not a command, then we need to process it like regular query
                    let query = message.text;

                    // check if chat is in some special state
                    let Chats = server.getModel('Chats');
                    let chat = yield Chats.findOne({ chatId: message.chat.id });

                    if (chat && chat.state !== Chats.STATES.IDLE) {
                        let command = _.lowerCase(chat.state);
                        if (_.isFunction(_.get(this, `commands.${command}`))) {
                            debug(`calling the command ${command}`);
                            return _.get(this, `commands.${command}`)(query, message);
                        }
                    }

                    // Test if query looks like the verb
                    if (this._testForVerb(query)) {
                        return _.get(this, 'commands.verb')(query);
                    }

                    return [{ type: MessageTypes.MESSAGE, text: text, options: options }];
                }
            }).bind(this)();
        }
    }

    return new Bot(telegramBot, botan);
}