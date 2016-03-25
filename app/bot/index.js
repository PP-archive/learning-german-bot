'use strict';

const TelegramBot = require('node-telegram-bot-api');
const _ = require('lodash');
const config = require('config');
const debug = require('debug')('bot');

// bot logic
let Bot = require('./bot');
// telegram bot
let bot = new TelegramBot(config.get('tokens.telegram'));
const botan = require('botanio')(config.get('tokens.botan'));

let url = config.get('baseUrl');
let crt = config.has('crt') ? config.get('crt') : undefined;

debug(`Setting the webHook: url: ${url}, crt: ${crt}`);
bot.setWebHook(url, crt);

exports.register = function (server, options, next) {
    server.decorate('server', 'bot', bot);

    // setting up the tracking by botan
    bot.on('message', (message) => {
        debug('sending the message to botan');
        botan.track(message);

        const chatId = message.chat.id;
        
        // processing the message
        let [response, options] = Bot.process(message);

        bot.sendMessage(chatId, response, options);
    });

    next();
};

exports.register.attributes = {
    name: 'bot',
    dependencies: ['web/index']
};