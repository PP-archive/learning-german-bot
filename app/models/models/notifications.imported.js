'use strict';

const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;
const Promise = require('bluebird');

module.exports = function (server, options) {
    let NotificationImportedSchema = new Schema({
            file: String,
            importedAt: { type: Date, default: Date.now }
        },
        { collection: 'notifications.imported' });

    return NotificationImportedSchema;
}