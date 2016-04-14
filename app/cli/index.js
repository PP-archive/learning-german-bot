'use strict';

const debug = require('debug')('cli');
const Promise = require('bluebird');
const _ = require('lodash');
const fs = require('fs');
const moment = require('moment');
const yaml = require('js-yaml');
const mongoose = require('mongoose');

module.exports = (server) => {
    return {
        ALLOWED_ACTIONS: ['init', 'test', 'notifications.create', 'notifications.import'],
        init() {
            this.server = server;
        },
        actions: {
            test(args) {
                return Promise.coroutine(function *() {
                    debug(args);
                })();
            },
            notifications: {
                create(args) {
                    return Promise.coroutine(function *() {
                        if (!args.name) {
                            debug('Error, "name" parameter should be provided');
                            return;
                        }

                        // default notification template
                        let template = {
                            name: _.snakeCase(args.name),
                            text: `Multi
line
:fire:`,
                            imported: false
                        };

                        let filename = `${moment().unix()}_${_.snakeCase(args.name)}.yaml`;
                        fs.writeFileSync(`${process.cwd()}/var/notifications/${filename}`, yaml.safeDump(template));

                        debug(`new notification created: ${filename}, please, fill it with data`);
                    }).bind(this)();
                },
                import(args) {
                    return Promise.coroutine(function *() {
                        let notificationsPath = `${process.cwd()}/var/notifications`;

                        let notificationFiles = fs.readdirSync(notificationsPath);

                        // iterating the possible notification files
                        while (notificationFiles.length > 0) {
                            let value = notificationFiles.shift();

                            if (fs.lstatSync(`${notificationsPath}/${value}`).isFile() && (value.charAt(0) !== '_') && (value.charAt(0) !== '.')) {
                                let content = yaml.safeLoad(fs.readFileSync(`${notificationsPath}/${value}`, 'utf8'))

                                // in this case we need to import the message to the notifications.messages
                                if (!content.imported) {
                                    let NotificationsMessages = this.server.getModel('NotificationsMessages');

                                    yield (new NotificationsMessages({
                                        name: content.name,
                                        text: content.text,
                                        state: NotificationsMessages.STATES.CREATED
                                    })).save();

                                    content.imported = true;
                                    content.importedAt = moment().format();

                                    fs.writeFileSync(`${notificationsPath}/${value}`, yaml.safeDump(content).replace(/(\n){3,}/g, "\n\n\n"));

                                    debug(`Notification "${content.name}" was imported.`);
                                }
                            }
                        }
                    }).bind(this)();
                }
            }
        },
        process(args) {
            return Promise.coroutine(function *() {
                yield _.get(this.actions, args.action).bind(this)(args);

                mongoose.disconnect();
            }).bind(this)();
        }
    }
};