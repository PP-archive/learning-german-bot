'use strict';

const MessageTypes = require('telegram/types/message');
const _ = require('lodash');

const Abstract = require('./_abstract');

const TYPE = 'TOP200';

class Top200 extends Abstract {
    static get TYPE() {
        return TYPE;
    }

    constructor(KB, i18n, locale) {
        super(KB, i18n, locale);

        this.TYPE = TYPE;

        this.LABEL = this.i18n.__('TOP 200');
        this.DESCRIPTION = this.i18n.__('training the TOP 200 german words');

        this.ITERATIONS = 10;
    }

    getTask() {
        const i18n = this.i18n;

        let flows = ['TO_LOCALE', 'TO_GERMAN'];
        let flow = _.sample(flows);

        let question, keyboard, variants, answer;

        let word, content;
        switch (flow) {
            case 'TO_LOCALE':
                word = _(this.KB.TOP200).keys().sample();
                content = this.KB.TOP200[word];

                question = i18n.__('How you will translate the word <code>%s</code> in english?', word);
                answer = content.translation[this.locale].split(';').map((v)=> {
                    return v.trim();
                });

                variants = [];
                variants.push(_.head(answer));

                while (variants.length < 3) {
                    let variant = _(_.sample(this.KB.TOP200).translation[this.locale].split(';')).head().trim();

                    if (variants.indexOf(variant) === -1) {
                        variants.push(variant);
                    }
                }
                variants = _.shuffle(variants);

                keyboard = [[variants[0]], [variants[1]], [variants[2]]];

                break;
            case 'TO_GERMAN':
                word = _(this.KB.TOP200).keys().sample();
                content = this.KB.TOP200[word];

                question = i18n.__('How you will translate the word <code>%s</code> to german?', content.translation[this.locale]);
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

    validateAnswer(task, answer) {
        switch (task.answer.flow) {
            case 'TO_LOCALE':
                return !(_(task.answer.value).indexOf(answer) === -1);
                break;
            case 'TO_GERMAN':
                return task.answer.value === answer;
                break;
        }
    }
}

module.exports = Top200;