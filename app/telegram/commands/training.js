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

    _emptyQuery(query, message) {
        return Promise.coroutine(function *() {
            const { Chats, Trainings } = this.models;

            this.chat = yield Chats.findOne({ chatId: message.chat.id });

            let text, options;

            // in case user is not yet registered
            if (!this.chat) {
                text = `По какой-то причине вы еще не зарегистриованы. Вы можете зарегистрироваться этой командой: /start`;
                return [{ type: MessageTypes.MESSAGE, text: text }];
            }

            this.active = yield Trainings.getActiveByChatId(message.chat.id);
            if (this.active) {
                return [{
                    type: MessageTypes.MESSAGE,
                    text: `В данный момент вы уже находитесь в режиме тренировки. Отвечайте на вопрос, либо пошлите команду /cancel`
                }];
            }

            this.chat.setState(Chats.STATES.TRAINING);

            text = `Выберите тип тренировки:\n`;

            let i = 1;
            _.forEach(this.server.plugins.trainings.engine.trainings, (training) => {
                text += `${i}. <code>${training.LABEL}</code> - ${training.DESCRIPTION}\n`;
                i++;
            });

            text += `\nЕсли хотите прервать - /cancel\n`;

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

    _setTraining(query, message) {
        return Promise.coroutine(function *() {
            const { Chats, Trainings } = this.models;

            this.tModel = _.find(this.server.plugins.trainings.engine.trainings, (training, key) => {
                return query === training.LABEL;
            });

            if (this.tModel) {
                let messages = [];

                // initial message
                messages.push({
                    type: MessageTypes.MESSAGE,
                    text: `Начинаем тренировку <code>${this.tModel.LABEL}</code>, вас ждет ${this.tModel.ITERATIONS} заданий.`,
                    options: {
                        parse_mode: 'HTML',
                        reply_markup: {
                            hide_keyboard: true
                        }
                    }
                });

                this.active = yield (new Trainings({
                    chatId: message.chat.id,
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
                let text = `Увы такой тренировки мы не нашли, попробуйте еще разок. Либо /cancel, чтобы прервать эту операцию.`;
                return [{ type: MessageTypes.MESSAGE, text: text }];
            }
        }).bind(this)();
    }

    _training(query, message) {
        return Promise.coroutine(function *() {
            const { Chats, Trainings } = this.models;

            let messages = [];
            this.tModel = _.find(this.server.plugins.trainings.engine.trainings, (training, key) => {
                return this.active.type === training.TYPE;
            });

            let lastQuestion = this.active.history.pop();

            // check if some question is already there
            if (!lastQuestion) {
                let text = `Увы что-то пошло не так. Сделайте /cancel.`;
                return [{ type: MessageTypes.MESSAGE, text: text }];
            }

            let result = this.tModel.validateAnswer(lastQuestion, query);
            lastQuestion.result = result;

            this.active.history.push(lastQuestion);
            yield this.active.save();

            if (result) {
                messages.push({
                    type: MessageTypes.MESSAGE,
                    text: `${emoji.get(':white_check_mark:')} верно!`
                });
            } else {
                let text = `${emoji.get(':x:')} не очень верно :(\n`;
                let answer = lastQuestion.answer.value;

                text += `Правильно: <code>${_.isArray(answer) ? answer.join(' или ') : answer }</code>`;
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

                let text = `Тренирка закончена с результатом: ${correctResults} из ${this.tModel.ITERATIONS}!`;

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
                this.chat = yield Chats.findOne({ chatId: message.chat.id });
                yield this.chat.setState(Chats.STATES.IDLE);
            }

            return messages;
        }).bind(this)();
    }

    process(query, message) {
        return Promise.coroutine(function *() {
            const { Chats, Trainings } = this.models;

            // in case it's simple /training call
            if (!query) {
                return this._emptyQuery(query, message);
            } else {
                this.active = yield Trainings.getActiveByChatId(message.chat.id);

                // probably this should be an attempt to choose the training
                if (!this.active) {
                    return this._setTraining(query, message);
                }
                // in case there is an active training
                else {
                    return this._training(query, message);
                }
            }
        }).bind(this)();
    }
}

module.exports = Training;