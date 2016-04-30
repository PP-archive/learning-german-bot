'use strict';

const fs = require('fs');

class Trainings {
    constructor(server, options) {
        // load trainings
        let trainingsPath = __dirname + '/trainings';
        this.trainings = {};
        fs.readdirSync(trainingsPath).forEach((value) => {
            if (fs.lstatSync(trainingsPath + '/' + value).isFile() && (value.charAt(0) !== '_')) {

                let file = value;

                /*Get model name for Sequalize from file name*/
                let training = require('./trainings/' + file)(server.KB);

                if (training.ACTIVE) {
                    this.trainings[training.TYPE] = training;
                }
            }
        });
    }
}

module.exports = function(server, options) {
    return new Trainings(server, options);
}