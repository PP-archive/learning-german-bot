'use strict';

const Code = require('code');   // assertion library
const Lab = require('lab');
const lab = exports.lab = Lab.script();

// load the local-modules
require(`${__dirname}/../../../_common.js`);

/**
 * This test suite is here to show, the tests basics
 */
lab.experiment('/cancel', () => {
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

    lab.test('/v1/test returns 200', { timeout: 10000 }, (done) => {
        let options = {
            method: 'POST',
            url: '/',
            payload: JSON.stringify({
                "update_id": 54513949,
                "message": {
                    "message_id": 1957,
                    "from": {
                        "id": 108749929,
                        "first_name": "Pavel",
                        "last_name": "Polyakov",
                        "username": "PavloPoliakov"
                    },
                    "chat": {
                        "id": 108749929,
                        "first_name": "Pavel",
                        "last_name": "Polyakov",
                        "username": "PavloPoliakov",
                        "type": "private"
                    },
                    "date": 1465136077,
                    "text": "/cancel",
                    "entities": [
                        {
                            "type": "bot_command",
                            "offset": 0,
                            "length": 7
                        }
                    ]
                }
            })
        };

        console.log('---');
        console.log(options);
        console.log('---');

        server.inject(options, (res) => {
            //console.log(res);
            //Code.expect(res.statusCode).to.equal(200);
            done();
        });
    });
});