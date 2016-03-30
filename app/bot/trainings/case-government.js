'use strict';

const MessageTypes = require('../message-types');

class CaseGovernment {
    constructor(KB) {
        this.KB = KB;

        this.ACTIVE = true;
        this.TYPE = 'CASE_GOVERNMENT';
        this.LABEL = 'Управление';
        this.DESCRIPTION = 'тренируем управление глаголов';
        this.ITERATIONS = 5;
    }

    getTask() {
        let text = `С чем только Dativ подавай?`;
        let options = {
            reply_markup: {
                keyboard: [['mit', 'auch'], ['bis', 'bald']],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        };

        let variants = ['mit', 'auch', 'bis', 'bald'];

        let task = {
            messages: [
                { type: MessageTypes.MESSAGE, text: text, options: options }
            ],
            question: text,
            variants: variants,
            answer: 'mit'
        }

        return task;
    }

    validateAnswer(question, answer) {
        return question.answer === answer;
    }
}

module.exports = function (KB) {
    return new CaseGovernment(KB);
};