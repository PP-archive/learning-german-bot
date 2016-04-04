'use strict';

const MessageTypes = require('types/message');
const _ = require('lodash');

class Top200 {
    constructor(KB) {
        this.KB = KB;

        this.ACTIVE = true;
        this.TYPE = 'TOP200';
        this.LABEL = 'ТОП 200';
        this.DESCRIPTION = 'тренируем топ 200 немецких слов';
        this.ITERATIONS = 10;
    }

    getTask() {
        let flows = ['TO_RUSSIAN', 'TO_GERMAN'];
        let flow = _.sample(flows);

        let question, keyboard, variants, answer;

        let word, content;
        switch (flow) {
            case 'TO_RUSSIAN':
                word = _(this.KB.TOP200).keys().sample();
                content = this.KB.TOP200[word];

                question = `Как на русский переводится слово <code>${word}</code> ?`;
                answer = content.translation.split(';').map((v)=> {
                    return v.trim();
                });

                variants = [];
                variants.push(_.head(answer));

                while (variants.length < 3) {
                    let variant = _(_.sample(this.KB.TOP200).translation.split(';')).head().trim();

                    if (variants.indexOf(variant) === -1) {
                        variants.push(variant);
                    }
                }
                console.log('v before:');
                console.log(variants);

                variants = _.shuffle(variants);

                console.log('v after:');
                console.log(variants);

                keyboard = [[variants[0]], [variants[1]], [variants[2]]];

                break;
            case 'TO_GERMAN':
                word = _(this.KB.TOP200).keys().sample();
                content = this.KB.TOP200[word];

                question = `Как на немецкий переводится <code>${content.translation}</code> ?`;
                answer = word;

                variants = [];
                variants.push(answer);

                while (variants.length < 3) {
                    let variant = _(this.KB.TOP200).keys().sample();

                    if (variants.indexOf(variant) === -1) {
                        variants.push(variant);
                    }
                }
                variants = _.shuffle(variants);

                keyboard = [[variants[0]], [variants[1]], [variants[2]]];
                break;
        }


        let options = {
            parse_mode: 'HTML',
            reply_markup: {
                keyboard: keyboard,
                resize_keyboard: true,
                one_time_keyboard: true
            }
        };

        let task = {
            messages: [
                { type: MessageTypes.MESSAGE, text: question, options: options }
            ],
            question: question,
            variants: variants,
            answer: {
                flow: flow,
                value: answer
            }
        }

        return task;
    }

    validateAnswer(question, answer) {
        switch (question.answer.flow) {
            case 'TO_RUSSIAN':
                return !(_(question.answer.value).indexOf(answer) === -1);
                break;
            case 'TO_GERMAN':
                return question.answer.value === answer;
                break;
        }
    }
}

module.exports = function (KB) {
    return new Top200(KB);
};