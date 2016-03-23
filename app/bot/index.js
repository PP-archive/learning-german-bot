'use strict';

const TelegramBot = require('node-telegram-bot-api');
const config = require('config');
const debug = require('debug')('bot');

exports.register = function (server, options, next) {
    let bot = new TelegramBot(config.get('token'));

    let url = config.get('baseUrl');
    let crt = config.has('crt') ? config.get('crt') : undefined;

    debug(`Setting the webHook: url: ${url}, crt: ${crt}`);
    bot.setWebHook(url, crt);

    server.decorate('server', 'bot', bot);

    next();
};

exports.register.attributes = {
    name: 'bot',
    dependencies: ['web/index']
};