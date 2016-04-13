'use strict';

const MessageTypes = require('telegram/types/message');
const Promise = require('bluebird');
const _ = require('lodash');
const emoji = require('node-emoji');
const fs = require('fs');

class Training {
    constructor(bot) {
        this.bot = bot;

        // load trainings
        let trainingsPath = __dirname + '/trainings';
        this.trainings = {};
        fs.readdirSync(trainingsPath).forEach((value) => {
            if (fs.lstatSync(trainingsPath + '/' + value).isFile() && (value.charAt(0) !== '_')) {

                let file = value;

                /*Get model name for Sequalize from file name*/
                let training = require('./trainings/' + file)(this.bot.KB);

                if (training.ACTIVE) {
                    this.trainings[training.TYPE] = training;
                }
            }
        });
    }

    process(query, message) {
        return Promise.coroutine(function *() {
            if (!query) {
                let Chats = this.bot.server.getModel('Chats');
                let chat = yield Chats.findOne({ chatId: message.chat.id });

                let text, options;

                // in case user is not yet registered
                if (!chat) {
                    text = `По какой-то причине вы еще не зарегистриованы. Вы можете зарегистрироваться этой командой: /start`;
                    return [{ type: MessageTypes.MESSAGE, text: text }];
                }

                let Trainings = this.bot.server.getModel('Trainings');
                let activeTraining = yield Trainings.getActiveByChatId(message.chat.id);
                if (activeTraining) {
                    return [{
                        type: MessageTypes.MESSAGE,
                        text: `В данный момент вы уже находитесь в режиме тренировки. Отвечайте на вопрос, либо пошлите команду /cancel`
                    }];
                }


                chat.setState(Chats.STATES.TRAINING);

                text = `Выберите тип тренировки:\n`;

                let i = 1;
                _.forEach(this.trainings, (training) => {
                    text += `${i}. <code>${training.LABEL}</code> - ${training.DESCRIPTION}\n`;
                    i++;
                });

                text += `\nЕсли хотите прервать - /cancel\n`;

                options = {
                    parse_mode: 'HTML',
                    reply_markup: {
                        keyboard: (() => {
                            let keyboard = [];
                            _.forEach(this.trainings, (training) => {
                                keyboard.push([training.LABEL]);
                            });

                            return keyboard;
                        })(),
                        resize_keyboard: true,
                        one_time_keyboard: true
                    }
                };

                return [{ type: MessageTypes.MESSAGE, text: text, options: options }];
            } else {
                let Trainings = this.bot.server.getModel('Trainings');
                let activeTraining = yield Trainings.getActiveByChatId(message.chat.id);

                // probably this should be an attempt to choose the training
                if (!activeTraining) {
                    let trainingModel = _.find(this.trainings, (training, key) => {
                        return query === training.LABEL;
                    });

                    if (trainingModel) {
                        let messages = [];

                        // initial message
                        messages.push({
                            type: MessageTypes.MESSAGE,
                            text: `Начинаем тренировку <code>${trainingModel.LABEL}</code>, вас ждет ${trainingModel.ITERATIONS} заданий.`,
                            options: {
                                parse_mode: 'HTML',
                                reply_markup: {
                                    hide_keyboard: true
                                }
                            }
                        });

                        let training = new Trainings({
                            chatId: message.chat.id,
                            type: trainingModel.TYPE,
                            status: Trainings.STATUSES.IN_PROGRESS
                        });
                        yield training.save();

                        // now we need to get the first task
                        let task = trainingModel.getTask(training.history);

                        messages = _.union(messages, task.messages);

                        console.log('---');
                        console.log(messages);
                        console.log('---');

                        training.history.push({
                            question: task.question,
                            variants: task.variants,
                            answer: task.answer,
                            result: undefined
                        });
                        yield training.save();

                        //messages
                        return messages;
                    } else {
                        let text = `Увы такой тренировки мы не нашли, попробуйте еще разок. Либо /cancel, чтобы прервать эту операцию.`;
                        return [{ type: MessageTypes.MESSAGE, text: text }];
                    }
                } else {
                    let messages = [];
                    let trainingModel = _.find(this.trainings, (training, key) => {
                        return activeTraining.type === training.TYPE;
                    });

                    let lastQuestion = activeTraining.history.pop();

                    // check if some question is already there
                    if (!lastQuestion) {
                        let text = `Увы что-то пошло не так. Сделайте /cancel.`;
                        return [{ type: MessageTypes.MESSAGE, text: text }];
                    }

                    let result = trainingModel.validateAnswer(lastQuestion, query);
                    lastQuestion.result = result;

                    activeTraining.history.push(lastQuestion);
                    yield activeTraining.save();

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


                    if (activeTraining.history.length < trainingModel.ITERATIONS) {
                        // now we need to get the first task
                        let task = trainingModel.getTask(activeTraining.history);

                        activeTraining.history.push({
                            question: task.question,
                            variants: task.variants,
                            answer: task.answer,
                            result: undefined
                        });
                        yield activeTraining.save();

                        messages = _.union(messages, task.messages);

                        console.log('---');
                        console.log(messages);
                        console.log('---');
                    } else {
                        let correctResults = _.reduce(activeTraining.history, function (sum, object) {
                            return sum + (object.result ? 1 : 0);
                        }, 0);

                        let text = `Тренировочка закончена, вы большой молодец: ${correctResults} из ${trainingModel.ITERATIONS}!`;

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

                        let Chats = this.bot.server.getModel('Chats');
                        let chat = yield Chats.findOne({ chatId: message.chat.id });

                        activeTraining.status = Trainings.STATUSES.FINISHED;
                        activeTraining.finishedAt = new Date();
                        yield activeTraining.save();

                        chat.state = Chats.STATES.IDLE;
                        yield chat.save();
                    }

                    return messages;
                }
            }
        }).bind(this)();
    }
}

module.exports = function(bot) {
    return new Training(bot);
}