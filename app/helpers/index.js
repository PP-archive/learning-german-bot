'use strict';

const debug = require('debug')('helpers/index.js');
const fs = require('fs');

exports.register = function (server, options, next) {
    // load helpers
    let helpersPath = __dirname + '/helpers';
    let helpers = {};
    fs.readdirSync(helpersPath).forEach((value) => {
        if (fs.lstatSync(helpersPath + '/' + value).isFile() && (value.charAt(0) !== '_')) {

            let file = value;

            /*Get model name for Sequalize from file name*/
            let helper = require(`${helpersPath}/${file}`);
            
            helpers[helper.name] = helper;
        }
    });

    server.expose(helpers);

    next();
};

exports.register.attributes = {
    pkg: require('./package.json')
};