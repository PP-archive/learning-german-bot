'use strict';

const MessageTypes = require('telegram/types/message');
const _ = require('lodash');

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
        let flows = ['PREPOSITION', 'CASE'];
        let flow = _.sample(flows);

        let question, keyboard, variants, answer;

        let verb, content, caseGovernment;
        switch (flow) {
            case 'PREPOSITION':
                let prepositions = ['über', 'nach', 'um', 'an', 'wegen', 'bevor', 'neben', 'zwischen', 'aber', 'unten', 'während', 'für', 'von', 'aus', 'in', 'vor', 'anstatt', 'wie', 'nahe', 'neben', 'auf', 'auf', 'aus', 'aussen', 'über', 'seit', 'als', 'zu', 'unter', 'bis', 'oben', 'ohne'];
                verb = _(this.KB.VERBS).keys().sample();
                content = this.KB.VERBS[verb];

                question = `С каким предлогом употребляется глагол <code>${verb}</code> ?`;
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

                question = `Какой падеж требует <code>${government}</code> ?`;
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