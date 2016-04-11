'use strict';

require('local-modules')('app');

const config = require('config');
const debug = require('debug')('cli-app');
const parsec = require('parsec');

/**
 * Here we do start the server, index.js is used to launch the web app
 */
require('./server')(require('./config/manifests/cli'))
    .then((server) => {
        let args = parsec();

        const cli = require('cli')(server, {});
        cli.init();

        if (!args.action || cli.ALLOWED_ACTIONS.indexOf(args.action) === -1) {
            debug(`Incorrect CLI call, action: ${args.action}`);
        } else {
            cli.process(args);
        }
    })
    .catch((error) => {
        if (error.stack) {
            debug(error.stack);
        } else {
            throw new Error(error);
        }
    });