'use strict';
const config = require('config');

module.exports = (function () {
    return {
        server: {},
        connections: [
            {
                uri: config.get('baseUrl'),
                port: config.get('port'),
                labels: ['web']
            }
        ],
        registrations: [
            {
                plugin: process.cwd() + '/app/i18n'
            },
            {
                plugin: 'models'
            },
            {
                plugin: 'KB'
            },
            {
                plugin: 'helpers'
            },
            {
                plugin: 'trainings'
            },
            {
                plugin: 'telegram'
            },
            {
                plugin: 'notificator'
            },
            {
                plugin: 'web/index'
            },
            {
                plugin: 'web/test'
            }
        ]
    };
})();