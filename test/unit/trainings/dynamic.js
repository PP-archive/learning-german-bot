'use strict';

const Code = require('code');   // assertion library
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const _ = require('lodash');

lab.experiment.skip('trainings module', () => {
    let server = {};

    lab.before((done) => {
        server.locales = {};

        let locales = ['en', 'ru', 'pl', 'be', 'nl'];

        let selected = _.sampleSize(locales, _.random(1, 5));

        for (let locale of selected) {
            server.locales[locale] = function () {
                return locale;
            }
        }

        done();
    });


    lab.experiment(`locales`, () => {

        lab.test('test', (done) => {
            Code.expect(1).to.be.equal(1);
            done();
        });

        let promises = [];
        for (let locale of _.keys(server.locales)) {
            console.log(locale);

            lab.test(`${locale} test`, (done) => {
                console.log(`I'm here: ${locale}`);
                Code.expect(server.locales[locale]()).to.be.equal(locale);
                done();
            });
        }
    });

});