'use strict';

const debug = require('debug')('i18n/index.js');
const i18n = require('i18n');
const config = require('config');

exports.register = function (server, options, next) {

    i18n.configure({
        locales: ['en-US', 'ru-RU'],
        directory: config.get('i18n.locales'),
        defaultLocale: 'en-US',
        objectNotation: false
    });

    server.decorate('server', 'i18n', i18n);

    let req = { headers: {}, i18n: {}};
    let res = {};

    i18n.init(req, req.i18n);

    req.i18n.setLocale('en-US');
    console.log(i18n.__('Пользоваться ботом можно так:'));
    //process.exit();

    next();
};

exports.register.attributes = {
    pkg: require('./package.json')
};