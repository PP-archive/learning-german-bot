'use strict';

const debug = require('debug')('bot/index.js');

exports.register = function (server, options, next) {
    // instance of the telegram bot
    const bot = require('./bot')(server, options);
    server.decorate('server', 'bot', bot);

    next();
};

exports.register.attributes = {
    name: 'bot',
    dependencies: ['web/index']
};