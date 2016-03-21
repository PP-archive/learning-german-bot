'use strict';

const Code = require('code');   // assertion library
const Lab = require('lab');
const lab = exports.lab = Lab.script();

// load the local-modules
require(`${__dirname}/../_common.js`);

/**
 * This test suite is here to show, the tests basics
 */
lab.experiment('example', () => {
    let server;

    /**
     * Preparing the server for the further usage
     */
    lab.before((done) => {
        require(`${process.cwd()}/server`)(require(`${process.cwd()}/config/manifests/web`))
            .then((instantiated) => {
                server = instantiated;
                done();
            })
            .catch((error) => {
                console.log(error);
                console.log('Such an error. Wow. Can not start server. Stop then.');
                process.exit();
            });
    });

    lab.test('/v1/test returns 200', (done) => {
        let options = {
            method: 'GET',
            url: '/test'
        };

        server.inject(options, (res) => {
            Code.expect(res.statusCode).to.equal(200);
            done();
        });
    });
});