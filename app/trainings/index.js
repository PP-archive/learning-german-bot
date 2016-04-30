'use strict';

const debug = require('debug')('trainings/index.js');

exports.register = function (server, options, next) {
    // instance of the telegram bot
    const trainings = require('./trainings')(server, options);
    server.expose('engine', trainings);

    next();
};

exports.register.attributes = {
    pkg: require('./package.json')
};