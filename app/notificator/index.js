'use strict';

const debug = require('debug')('notificator');
const Promise = require('bluebird');
const _ = require('lodash');

const CronJob = require('cron').CronJob;

/**
 *
 * @param {{plugins : *, preferences : *}} server
 * @param options
 * @param next
 */
exports.register = function (server, options, next) {
    let Chats = server.getModel('Chats');
    let NotificationsMessages = server.getModel('Notifications.messages');
    let NotificationsQueue = server.getModel('Notifications.queue');


    let jobs = {
        messages: {
            job: undefined,
            inProgress: false
        }
    };
    jobs.messages = new CronJob({
        cronTime: '*/5 * * * * *',
        onTick: () => {
            console.log('inside the job');
            return Promise.coroutine(function *() {
                if (jobs.messages.inProgress) {
                    debug('Previous job is still in progress');
                    return;
                }

                let message = yield NotificationsMessages.findOne({ state: { $in: [NotificationsMessages.STATES.CREATED, NotificationsMessages.STATES.IN_PROGRESS] } })
                    .sort({ createdAt: -1 });

                if(!message) {
                    return;
                }

                switch (message.state) {
                    case NotificationsMessages.STATES.CREATED:
                        let chatIds = yield Chats.find().distinct('chatId');

                        let iterations = _.chunk(chatIds, 100);

                        while (iterations.length) {
                            let objects = [];

                            let iteration = iterations.shift();

                            _.forEach(iteration, (chatId) => {
                                objects.push({
                                    messageId: message._id,
                                    chatId: chatId,
                                    state: NotificationsQueue.STATES.CREATED
                                });
                            });

                            yield NotificationsQueue.collection.insert(objects);

                            debug(`Inserted #${objects.lenght} objects`);
                        }

                        message.state = NotificationsMessages.STATES.IN_PROGRESS;
                        yield message.save();

                        debug(`Done spreading the message "${message.name}`);
                        break;
                    case NotificationsMessages.STATES.IN_PROGRESS:
                        let nCreated = yield NotificationsQueue.count({
                            messageId: message._id,
                            state: NotificationsQueue.STATES.CREATED
                        });

                        debug('nCreated', nCreated);

                        if (nCreated > 0) {
                            let nNotCreated = yield NotificationsQueue.count({
                                messageId: message._id,
                                state: { $ne: NotificationsQueue.STATES.CREATED }
                            });
                            debug(`Wow, it's in progress ${_.round(nNotCreated / nCreated, 2) * 100}% is done`);
                        }
                        else {
                            message.state = NotificationsMessages.STATES.FINISHED;
                            message.finishedAt = new Date();
                            yield message.save();

                            debug(`Message "${message.name} was successfully sent`);
                        }
                        break;
                }
            }).bind(this)();
        },
        onComplete: () => {
            jobs.messages.inProgress = false;
        },
        start: true,
        runOnInit: true
    });

    next();
};

exports.register.attributes = {
    pkg: require('./package.json')
};