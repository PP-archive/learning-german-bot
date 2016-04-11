'use strict';

const MessageTypes = require('bot/types/message');
const VerbsHelper = require('helpers/verbs');
const _ = require('lodash');

class Idle {
    constructor(bot) {
        this.bot = bot;

        this.verbsHelper = new VerbsHelper(this.bot.KB.VERBS);

    }
    
    process(query, message) {
        let text = 'Ничего не найдено', options = {
            parse_mode: 'HTML',
            reply_markup: {
                hide_keyboard: true
            }
        };

        // Test if query looks like the verb
        if (this.verbsHelper.testForVerb(query)) {
            return _.get(this.bot, 'commands.verb').process(query, message);
        }

        return [{ type: MessageTypes.MESSAGE, text: text, options: options }];
    }
}

module.exports = function(bot) {
    return new Idle(bot);
}