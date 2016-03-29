'use strict';

const MessageTypes = require('../message-types');

class CaseGovernment {
    get ACTIVE() {
        return true;
    }
    
    get TYPE() {
        return 'CASE_GOVERNMENT';
    }

    get LABEL() {
        return 'Управление';
    }

    get ITERATIONS() {
        return 5;
    }

    constructor(KB) {
        this.KB = KB;
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

        return [{ type: MessageTypes.MESSAGE, text: text, options: options }];
    }

    validateAnswer(answer) {
        return true;
    }
}

module.exports = function (KB) {
    return new CaseGovernment(KB);
};