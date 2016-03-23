'use strict';

const TelegramBot = require('node-telegram-bot-api');
const config = require('config');


exports.register = function (server, options, next) {
    let bot = new TelegramBot(config.get('token'));
    bot.setWebHook(config.get('baseUrl'), config.has('crt') ? config.get('crt') : undefined);

    server.decorate('server', 'bot', bot);

    next();
};

exports.register.attributes = {
    name: 'bot',
    dependencies: ['web/index']
};