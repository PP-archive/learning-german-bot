'use strict';

const fs = require('fs');

module.exports = function (server, options) {
    let trainingsPath = __dirname + '/trainings';
    let trainings = {};

    fs.readdirSync(trainingsPath).forEach((value) => {
        if (fs.lstatSync(trainingsPath + '/' + value).isFile() && (value.charAt(0) !== '_')) {

            let file = value;

            /*Get model name for Sequalize from file name*/
            let training = require('./trainings/' + file);

            for (let locale of training.LOCALES) {
                // create nested object, if needed
                if (!trainings[locale]) {
                    trainings[locale] = {};
                }

                if (training.ACTIVE) {
                    trainings[locale][training.TYPE] = new training(server.KB, server.i18n, locale);
                }
            }
        }
    });
    
    return trainings;
}