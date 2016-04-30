'use strict';

const debug = require('debug')('trainings/index.js');
const yaml = require('js-yaml');
const fs = require('fs');

exports.register = function (server, options, next) {
    // instance of the telegram bot
    let KB = {
        VERBS: yaml.safeLoad(fs.readFileSync('./kb/verbs.yaml', 'utf8')),
        TOP200: yaml.safeLoad(fs.readFileSync('./kb/top200.yaml', 'utf8')),
        TOP500_VERBS: yaml.safeLoad(fs.readFileSync('./kb/top500-verbs.yaml', 'utf8'))
    };
    server.decorate('server', 'KB', KB);

    next();
};

exports.register.attributes = {
    pkg: require('./package.json')
};