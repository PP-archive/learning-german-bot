'use strict';

const MessageTypes = require('telegram/types/message');
const Promise = require('bluebird');
const _ = require('lodash');
const emoji = require('node-emoji');
const fs = require('fs');

const Abstract = require('./_abstract');

class Training extends Abstract {
    constructor(server, bot) {
        super(server, bot);

        this.chat = undefined;
        // stands for training model
        this.tModel = undefined;
        this.active = undefined;
    }

    _emptyQuery() {
        return Promise.coroutine(function *() {
            const { i18n } = this.chat;
            const locale = i18n.getLocale();

            const { Chats, Trainings } = this.models;

            let text, options;

            this.active = yield Trainings.getActiveByChatId(this.message.chat.id);
            if (this.active) {
                return [{
                    type: MessageTypes.MESSAGE,
                    text: i18n.__('At this moment you are in the middle of training. Answer the question, or sent the /cancel command.')
                }];
            }

            this.chat.setState(Chats.STATES.TRAINING);

            text = i18n.__('Choose the training type:') + '\n';

            let i = 1;
            _.forEach(this.server.plugins.trainings.engine.trainings[locale], (training) => {
                text += `${i}. ${i18n.__('<code>%s</code> - %s', training.LABEL, training.DESCRIPTION)}\n`;
                i++;
            });

            text += `\n${i18n.__('In case you want to stop - /cancel')}\n`;

            options = {
                parse_mode: 'HTML',
                reply_markup: {
                    keyboard: (() => {
                        let keyboard = [];
                        _.forEach(this.server.plugins.trainings.engine.trainings, (training) => {
                            keyboard.push([training.LABEL]);
                        });

                        return keyboard;
                    })(),
                    resize_keyboard: true,
                    one_time_keyboard: true
                }
            };

            return [{ type: MessageTypes.MESSAGE, text: text, options: options }];
        }).bind(this)();
    }

    _setTraining() {
        return Promise.coroutine(function *() {
            const { i18n } = this.chat;
            const locale = i18n.getLocale();

            const { Chats, Trainings } = this.models;

            this.tModel = _.find(this.server.plugins.trainings.engine.trainings[locale], (training, key) => {
                return this.query === training.LABEL;
            });

            if (this.tModel) {
                let messages = [];

                // initial message
                messages.push({
                    type: MessageTypes.MESSAGE,
                    text: i18n.__('We are going to start the <code>%s</code> training, there would be %s questions', this.tModel.LABEL, this.tModel.ITERATIONS),
                    options: {
                        parse_mode: 'HTML',
                        reply_markup: {
                            hide_keyboard: true
                        }
                    }
                });

                this.active = yield (new Trainings({
                    chatId: this.message.chat.id,
                    type: this.tModel.TYPE,
                    status: Trainings.STATUSES.IN_PROGRESS
                })).save();
                //yield this.active.save();

                // now we need to get the first task
                let task = this.tModel.getTask(this.active.history);

                messages = _.union(messages, task.messages);

                this.active.history.push({
                    question: task.question,
                    variants: task.variants,
                    answer: task.answer,
                    result: undefined
                });
                yield this.active.save();

                //messages
                return messages;
            } else {
                let text = i18n.__('Unfortunately we haven\'t found such training, try one more time. Or /cancel, in order to stop this command.');
                return [{ type: MessageTypes.MESSAGE, text: text }];
            }
        }).bind(this)();
    }

    _training() {
        return Promise.coroutine(function *() {
            const { i18n } = this.chat;
            const locale = i18n.getLocale();

            const { Chats, Trainings } = this.models;

            let messages = [];
            this.tModel = _.find(this.server.plugins.trainings.engine.trainings[locale], (training, key) => {
                return this.active.type === training.TYPE;
            });

            let lastQuestion = this.active.history.pop();

            // check if some question is already there
            if (!lastQuestion) {
                let text = i18n.__('Unfortunately, something went wrong. Make /cansel, please.')
                return [{ type: MessageTypes.MESSAGE, text: text }];
            }

            let result = this.tModel.validateAnswer(lastQuestion, this.query);
            lastQuestion.result = result;

            this.active.history.push(lastQuestion);
            yield this.active.save();

            if (result) {
                messages.push({
                    type: MessageTypes.MESSAGE,
                    text: i18n.__('%s correct', emoji.get(':white_check_mark:'))
                });
            } else {
                let text = i18n.__('% incorrect\n', emoji.get(':x:'));
                let answer = lastQuestion.answer.value;

                text += i18n.__('Correct: <code>%s</code>', _.isArray(answer) ? answer.join(i18n.__(' or ')) : answer)
                messages.push({
                    type: MessageTypes.MESSAGE,
                    text: text,
                    options: {
                        parse_mode: 'HTML'
                    }
                });
            }

            if (this.active.history.length < this.tModel.ITERATIONS) {
                // now we need to get the first task
                let task = this.tModel.getTask(this.active.history);

                this.active.history.push({
                    question: task.question,
                    variants: task.variants,
                    answer: task.answer,
                    result: undefined
                });
                yield this.active.save();

                messages = _.union(messages, task.messages);
            } else {
                let correctResults = _.reduce(this.active.history, function (sum, object) {
                    return sum + (object.result ? 1 : 0);
                }, 0);

                let text = i18n.__('Training was finished, with the result: %s from %s', correctResults, this.tModel.ITERATIONS);

                messages.push({
                    type: MessageTypes.MESSAGE,
                    text: text,
                    options: {
                        parse_mode: 'HTML',
                        reply_markup: {
                            hide_keyboard: true
                        }
                    }
                });

                this.active.status = Trainings.STATUSES.FINISHED;
                this.active.finishedAt = new Date();
                yield this.active.save();

                // store the new chat state
                this.chat = yield Chats.findOne({ chatId: this.message.chat.id });
                yield this.chat.setState(Chats.STATES.IDLE);
            }

            return messages;
        }).bind(this)();
    }

    process() {
        return Promise.coroutine(function *() {
            const { Chats, Trainings } = this.models;

            // in case it's simple /training call
            if (!this.query) {
                return this._emptyQuery();
            } else {
                this.active = yield Trainings.getActiveByChatId(this.message.chat.id);

                // probably this should be an attempt to choose the training
                if (!this.active) {
                    return this._setTraining();
                }
                // in case there is an active training
                else {
                    return this._training();
                }
            }
        }).bind(this)();
    }
}

module.exports = Training;