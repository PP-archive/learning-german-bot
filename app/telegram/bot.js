'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const yaml = require('js-yaml');
const fs = require('fs');
const debug = require('debug')('bot');
const config = require('config');
const emoji = require('node-emoji');
const moment = require('moment');

// telegram bot preparation
const TelegramBot = require('node-telegram-bot-api');
const Botan = require('botanio');

// defines
const MessageTypes = require('telegram/types/message');

class Bot {
    /**
     * constructor
     * @param bot
     * @param botan
     */
    constructor(server, options) {
        this.server = server;

        this.KB = {};
        this.KB.VERBS = yaml.safeLoad(fs.readFileSync('./kb/verbs.yaml', 'utf8'));
        this.KB.TOP200 = yaml.safeLoad(fs.readFileSync('./kb/top200.yaml', 'utf8'));
        this.KB.TOP500_VERBS = yaml.safeLoad(fs.readFileSync('./kb/top500-verbs.yaml', 'utf8'));

        // init telegram bot
        this.bot = new TelegramBot(config.get('tokens.telegram'));
        let url = config.get('baseUrl');
        let crt = config.has('crt') ? config.get('crt') : undefined;
        this.bot.setWebHook(url, crt);
        debug(`Setting the webHook: url: ${url}, crt: ${crt}`);

        // init botan
        this.botan = Botan(config.get('tokens.botan'));

        // receiving each message
        this.bot.on('message', (message) => {
            debug('sending the message to botan');
            // setting up the tracking by botan
            this.botan.track(message);

            const chatId = message.chat.id;

            // processing the message
            this.process(message).then((messages) => {
                let promises = [];
                _.forEach(messages, (reply) => {
                    switch (reply.type) {
                        case MessageTypes.MESSAGE:
                            promises.push({
                                method: this.bot.sendMessage,
                                context: this.bot,
                                args: [chatId, reply.text, reply.options || {}]
                            });
                            break;
                        default:
                            debug('Undefined');
                            break;
                    }
                });

                Promise.coroutine(function *() {
                    while (promises.length) {
                        let promise = promises.shift();

                        let result = yield promise.method.apply(promise.context, promise.args);
                    }
                })();
            });
        });
    }

    /**
     * Incapsulation of the command processors
     * @returns {Object}
     */
    get commands() {
        return {
            start: require('./commands/start'),
            idle: require('./commands/idle'),
            cancel: require('./commands/cancel'),
            training: require('./commands/training'),
            verb: require('./commands/verb'),
            help: require('./commands/help'),
            about: require('./commands/about'),
            thanks: require('./commands/thanks'),
            sources: require('./commands/sources'),
            stats: require('./commands/stats')
        }
    }

    /**
     * Incoming messages processor
     * @param message
     * @returns []
     */
    process(message) {

        return Promise.coroutine(function *() {
            const Chats = this.server.getModel('Chats');

            let chat = yield Chats.findOne({ chatId: message.chat.id });

            if (!chat) {
                return [{
                    type: MessageTypes.MESSAGE,
                    text: server.i18n.__({phrase: 'Please, first send the /start command', locale: 'en-US'}),
                    options: {
                        parse_mode: 'HTML',
                        reply_markup: {
                            hide_keyboard: true
                        }
                    }
                }];
            }

            // In case incoming message is text one
            if (message.text) {
                // what to call ?
                let call = {
                    command: undefined,
                    class: undefined,
                    data: {
                        chat: chat,
                        query: undefined,
                        message: message
                    }
                };

                let matches = message.text.match(/\/(.*?)(\s|$)(.*)/);

                // In case the message looks something like command
                if (matches) {
                    let [,command,,query] = matches;

                    // Trying to process the message, if such command is already defined
                    debug('looking for %s', `commands.${command}.process`);
                    if (_.has(this, `commands.${command}`) && this.commands[command].prototype.process) {
                        call.command = command;
                        call.data.query = query;
                    }
                }

                // If this was not a command, then we need to process it like regular query
                // setting the query
                call.data.query ? null : call.data.query = message.text;

                if (!call.command) {
                    // check if chat is in some special state
                    if (chat && chat.state !== Chats.STATES.IDLE) {
                        let command = _.lowerCase(chat.state);
                        if (_.has(this, `commands.${command}`) && this.commands[command].prototype.process) {
                            call.command = command;
                        }
                    }
                }

                // in case command was not yet defined - call idle command
                if (!call.command) {
                    call.command = 'idle';
                }

                debug(`calling the command ${call.command}.process`);
                // creating an instance of the particular command
                call.class = _.get(this, `commands.${call.command}`);
                let command = new call.class(this.server, this);
                command.init(call.data);

                return yield command.process();
            }
        }).bind(this)();
    }
}

module.exports = function (server, options) {
    return new Bot(server, options);
}