'use strict';

const MessageTypes = require('telegram/types/message');
const _ = require('lodash');

const Abstract = require('./_abstract');

class CaseGovernment extends Abstract {

    constructor(KB, i18n, locale) {
        super(KB, i18n, locale);

        this.TYPE = 'CASE_GOVERNMENT';

        this.LABEL = i18n.__('Case government');
        this.DESCRIPTION = i18n.__('training the case government');

        this.ITERATIONS = 5;
    }

    getTask() {
        const i18n = this.i18n;

        let flows = ['PREPOSITION', 'CASE'];
        let flow = _.sample(flows);

        let question, keyboard, variants, answer;

        let verb, content, caseGovernment;
        switch (flow) {
            case 'PREPOSITION':
                let prepositions = ["über", "nach", "um", "an", "wegen", "bevor", "neben", "zwischen", "aber", "unten", "während", "für", "von", "aus", "in", "vor", "anstatt", "wie", "nahe", "auf", "aussen", "seit", "als", "zu", "unter", "bis", "oben", "ohne"];
                verb = _(this.KB.VERBS).keys().sample();
                content = this.KB.VERBS[verb];

                question = i18n.__('Which preposition is used with the verb <code>%s</code> ?', verb);
                answer = [];
                _.forEach(content['case government'], (value, key) => {
                    answer.push(_.chain(key).trim().split(' ').last().value());
                });

                variants = _.clone(answer);
                while (variants.length < 4) {
                    let suggestion = _.sample(prepositions);
                    if (_(variants).indexOf(suggestion) === -1) {
                        variants.push(suggestion);
                    }
                }

                // randomise one more type
                variants = _.shuffle(variants);

                keyboard = [[variants[0], variants[1]], [variants[2], variants[3]]];

                break;
            case 'CASE':
                let cases = ['A', 'D'];
                verb = _(this.KB.VERBS).keys().sample();
                content = this.KB.VERBS[verb];
                caseGovernment = content['case government'];
                let government = _(caseGovernment).keys().sample();

                question = i18n.__('Which case is required by %s?', government);
                answer = caseGovernment[government].case;

                variants = _.shuffle(['A', 'D']);

                keyboard = [[variants[0], variants[1]]];
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
            case 'PREPOSITION':
                return !(_(question.answer.value).indexOf(answer) === -1);
                break;
            case 'CASE':
                return question.answer.value === answer;
                break;
        }
    }
}

module.exports = function (KB) {
    return new CaseGovernment(KB);
};