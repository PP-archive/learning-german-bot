'use strict';

const fs = require('fs');
const config = require('config');
const mongoose = require('mongoose');
const debug = require('debug')('models-loader');
const _ = require('lodash');

// redefining the promise library
mongoose.Promise = require('bluebird');
mongoose.set('debug', true)

// setting up the connection
mongoose.connect(config.get('mongodb'));

/**
 *
 * @param {{plugins : *, preferences : *}} server
 * @param options
 * @param next
 */
exports.register = function (server, options, next) {
    let modelsPath = __dirname + '/models';
    let models = {};

    // decorate server with getModel, to work with models
    server.decorate('server', 'getModel', function (name) {
        if (!(name in models)) {
            throw new Error('No Model with the name "' + name + '" is available');
        } else {
            // if the model is there, just return
            return models[name];
        }
    });

    // decorate server with db, so we can execute direct queries
    server.decorate('server', 'mongoose', mongoose.connection);

    fs.readdirSync(modelsPath).forEach(function (value) {
        if (fs.lstatSync(modelsPath + '/' + value).isFile() && (value.charAt(0) !== '_')) {

            let file = value;
            let modelSchema;

            /*Get model name for Sequalize from file name*/
            let table = file.substr(0, file.lastIndexOf('.'));
            let modelName = _.camelCase(table);
            modelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);

            modelSchema = require(modelsPath + '/' + file)(server, options);

            models[modelName] = mongoose.model(table, modelSchema);
        }
    });

    next();
};

exports.register.attributes = {
    pkg: require('./package.json')
};