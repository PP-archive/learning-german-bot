'use strict';

const debug = require('debug')('web/index');
const fs = require('fs');

/**
 *
 * @param {{plugins : *, preferences : *}} server
 * @param options
 * @param next
 */

exports.register = function (server, options, next) {

    server.route({
        method: 'GET',
        path: '/',
        handler: function (request, reply) {
            return reply({hello:1});
        }
    });

    server.route({
        method: 'POST',
        path: '/',
        handler: function (request, reply) {
            debug(request.payload.message);
            let msg = request.payload.message;
            var chatId = msg.chat.id;
            server.bot.sendMessage(chatId, `hello`);
            return reply(request.payload);
        }
    });

    next();
};

exports.register.attributes = {
    pkg: require('./package.json')
};