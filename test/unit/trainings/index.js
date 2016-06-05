'use strict';

const Code = require('code');   // assertion library
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const Hapi = require('hapi');
const _ = require('lodash');

const Promise = require('bluebird');


// load the local-modules
require(`${__dirname}/../_common.js`);

/**
 * This test suite is here to show, the tests basics
 */

lab.experiment('trainings module', () => {
    let server;

    lab.before((done) => {
        server = new Hapi.Server();
        server.connection({});
        server.register([require(process.cwd() + '/app/i18n'),
            require('KB'),
            require('trainings')], (err) => {
            // abort everything in case we have failed to register the plugin
            if (err) {
                throw new Error(`Failed to register the plugin (${err})`)
            }

            server.initialize((err) => {
                if (err) {
                    throw new Error(`Failed to register server (${err}`);
                }

                done();
            })
        });
    });

    lab.test('module is loaded', (done) => {
        Code.expect(server.plugins.trainings).to.be.an.object();
        Code.expect(_.keys(server.plugins.trainings)).to.include(['en-US', 'ru-RU']);
        done();
    });


    lab.experiment('trainings check', ()=> {
        lab.test(`en-US CASE_GOVERNMENT`, (done) => {
            // get task and check the structure
            let task = server.plugins.trainings['en-US']['CASE_GOVERNMENT'].getTask();
            Code.expect(task).to.be.an.object();
            Code.expect(task.question).to.be.a.string();
            Code.expect(task.answer).to.be.an.object();
            Code.expect(task.variants).to.be.an.array()

            // correct answer should pass
            let correctAnswer = server.plugins.trainings['en-US']['CASE_GOVERNMENT'].validateAnswer(task, _.first(task.answer.value));
            Code.expect(correctAnswer).to.be.true();

            // incorrect answer should not pass
            let incorrectAnswer = server.plugins.trainings['en-US']['CASE_GOVERNMENT'].validateAnswer(task, 'INCORRECT');
            Code.expect(incorrectAnswer).to.be.false();

            done();
        });
    });
});