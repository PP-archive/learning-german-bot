'use strict';

const Code = require('code');   // assertion library
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const Hapi = require('hapi');
const _ = require('lodash');


// load the local-modules
require(`${__dirname}/../_common.js`);

/**
 * This test suite is here to show, the tests basics
 */
lab.experiment('KB module', () => {
    let server;

    lab.before((done) => {
        server = new Hapi.Server();
        server.register([require('trainings')], (err) => {
            // abort everything in case we have failed to register the plugin
            if (err) {
                throw new Error(`Failed to register the plugin (${err})`)
            }

            done();
        });
    });

    lab.test('trainings module', (done) => {
        done();
    });
});