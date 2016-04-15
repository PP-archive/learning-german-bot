'use strict';

const debug = require('debug')('notificator');
const Promise = require('bluebird');
const _ = require('lodash');
const emoji = require('node-emoji');

const CronJob = require('cron').CronJob;

/**
 *
 * @param {{plugins : *, preferences : *}} server
 * @param options
 * @param next
 */
exports.register = function (server, options, next) {
    let Chats = server.getModel('Chats');
    let NotificationsMessages = server.getModel('NotificationsMessages');
    let NotificationsQueue = server.getModel('NotificationsQueue');


    let jobs = {
        messages: {
            job: undefined,
            inProgress: false
        },
        queue: {
            job: undefined,
            inProgress: false
        }
    };
    jobs.messages.job = new CronJob({
        cronTime: '*/30 * * * * *',
        onTick: () => {
            debug('inside the messages job');
            return Promise.coroutine(function *() {
                if (jobs.messages.inProgress) {
                    debug('Previous job is still in progress');
                    return;
                }

                jobs.messages.inProgress = true;

                let message = yield NotificationsMessages.findOne({ state: { $in: [NotificationsMessages.STATES.CREATED, NotificationsMessages.STATES.IN_PROGRESS] } })
                    .sort({ createdAt: -1 });

                if (!message) {
                    jobs.messages.inProgress = false;
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
                                    _message: message._id,
                                    chatId: chatId,
                                    state: NotificationsQueue.STATES.CREATED,
                                    exceptions: []
                                });
                            });

                            yield NotificationsQueue.collection.insert(objects);

                            debug(`Inserted #${objects.length} objects`);
                        }

                        message.state = NotificationsMessages.STATES.IN_PROGRESS;
                        yield message.save();

                        debug(`Done spreading the message "${message.name}"`);
                        break;
                    case NotificationsMessages.STATES.IN_PROGRESS:
                        let nCreated = yield NotificationsQueue.count({
                            _message: message._id,
                            state: NotificationsQueue.STATES.CREATED
                        });

                        debug('nCreated', nCreated);

                        if (nCreated > 0) {
                            let nNotCreated = yield NotificationsQueue.count({
                                _message: message._id,
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

                jobs.messages.inProgress = false;
            }).bind(this)();
        },
        start: true,
        runOnInit: true
    });

    jobs.queue.job = new CronJob({
        cronTime: '*/5 * * * * *',
        onTick: () => {
            debug('inside the queue job');
            return Promise.coroutine(function *() {

                if (jobs.queue.inProgress) {
                    debug('Previous job is still in progress');
                    return;
                }
                jobs.queue.inProgress = true;

                let queue = yield NotificationsQueue.find({ state: NotificationsMessages.STATES.CREATED }).limit(5).populate('_message');

                while (queue.length) {
                    let record = queue.shift();

                    try {
                        yield server.telegram.bot.sendMessage(record.chatId,
                            emoji.emojify(record._message.text),
                            { parse_mode: 'HTML' });

                        debug(`Message was sent successfully to the chatId ${record.chatId}`);

                        record.state = NotificationsQueue.STATES.SENT;
                        record.sentAt = new Date();
                    } catch (e) {
                        debug(`Exception during message sending`, e);
                        record.exceptions.push(e);

                        if (record.exceptions.length >= 5) {
                            record.state = NotificationsQueue.STATES.EXCEPTION;
                        }
                    }

                    yield record.save();
                }

                jobs.queue.inProgress = false;
            }).bind(this)();
        },
        start: true,
        runOnInit: true
    });

    next();
};

exports.register.attributes = {
    pkg: require('./package.json')
};