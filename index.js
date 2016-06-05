'use strict';

require('local-modules')('app');

const config = require('config');
const debug = require('debug')('web-app');

/**
 * Here we do start the server, index.js is used to launch the web app
 */
require('./server')(require('./config/manifests/web')).then((server) => {

    server.start(function (error) {

        if (error) {
            throw error;
        }

        server.on('request-internal', function requestInternalError(request, event, tags) {
            if (tags.error) {
                if (event.data instanceof Error) {
                    debug(event.data.stack);
                }
            }
        });

        console.log('Hapi days!');
        console.log('currentUrl: ', server.info.uri);
    });
}).catch((error) => {
    if (error.stack) {
        debug(error.stack);
    } else {
        throw new Error(error);
    }
});