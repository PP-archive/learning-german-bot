'use strict';

const debug = require('debug')('main-app');
const Glue = require('glue');
const Promise = require('bluebird');

module.exports = (manifest) => {
    console.log('HELLO');
    
    return new Promise((resolve, reject) => {
        let options = {
            relativeTo: __dirname
        };

        /**
         * Load all plugins declared in manifest and start web-server with specified settings.
         */
        Glue.compose(manifest, options,
            (err, server) => {
                if (err) {
                    throw err;
                }

                server.initialize((err) => {
                    if (err) {
                        throw err;
                    }
                    resolve(server);
                });
            });
    });
}
