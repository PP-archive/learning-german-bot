'use strict';

const MessageTypes = require('telegram/types/message');
const _ = require('lodash');

const Abstract = require('./_abstract');

const TYPE = 'TOP500_VERBS';

class Top500Verbs extends Abstract {

    static get TYPE() {
        return TYPE;
    }

    constructor(KB, i18n, locale) {
        super(KB, i18n, locale);

        this.TYPE = TYPE;

        this.LABEL = this.i18n.__('TOP 500 verbs');
        this.DESCRIPTION = this.i18n.__('training the TOP 500 german verbs');

        this.ITERATIONS = 10;
    }

    getTask() {
        let flows = ['TO_LOCALE', 'TO_GERMAN'];
        let flow = _.sample(flows);

        let question, keyboard, variants, answer;

        let word, content;
        switch (flow) {
            case 'TO_LOCALE':
                word = _(this.KB.TOP500_VERBS).keys().sample();
                content = this.KB.TOP500_VERBS[word];

                question = i18n.__('How would you translate the verb <code>%s</code> in english?', word);
                answer = content.translation[this.locale].split(',').map((v)=> {
                    v.replace(/\(.*?\)/gi, '');
                    return v.trim();
                });

                variants = [];
                variants.push(_.head(answer));

                while (variants.length < 3) {
                    let variant = _(_.sample(this.KB.TOP500_VERBS).translation[this.locale].split(',')).head().replace(/\(.*?\)/gi, '').trim();

                    if (variants.indexOf(variant) === -1) {
                        variants.push(variant);
                    }
                }
                variants = _.shuffle(variants);

                keyboard = [[variants[0]], [variants[1]], [variants[2]]];

                break;
            case 'TO_GERMAN':
                word = _(this.KB.TOP500_VERBS).keys().sample();
                content = this.KB.TOP500_VERBS[word];

                question = i18n.__('How would you translate the verb <code>%s</code> to german?', word);
                answer = word;

                variants = [];
                variants.push(answer);

                while (variants.length < 3) {
                    let variant = _(this.KB.TOP500_VERBS).keys().sample();

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

module.exports = Top500Verbs;