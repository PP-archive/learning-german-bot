'use strict';

const debug = require('debug')('web/test');

/**
 *
 * @param {{plugins : *, preferences : *}} server
 * @param options
 * @param next
 */

exports.register = function (server, options, next) {

    server.route({
        method: 'GET',
        path: '/test',
        handler: function (request, reply) {
            return reply({ query: request.query, payload: request.payload });
        }
    });

    server.route({
        method: 'GET',
        path: '/get-session',
        handler: function (request, reply) {
            return reply(`<pre>${JSON.stringify(request.yar._store, null, 4)}</pre>`);
        }
    });

    next();
};

exports.register.attributes = {
    pkg: require('./package.json')
};