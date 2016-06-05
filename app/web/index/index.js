'use strict';

const debug = require('debug')('web/index');
const fs = require('fs');
const Promise = require('bluebird');
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
            return Promise.coroutine(function *(){
                console.log("HELLO WE ARE HERE");
                server.telegram.bot.processUpdate(request.payload);
                yield Promise.delay(5000);
                return reply();
            }).bind(this)();
        }
    });

    next();
};

exports.register.attributes = {
    pkg: require('./package.json')
};