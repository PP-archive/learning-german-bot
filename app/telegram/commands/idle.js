'use strict';

const MessageTypes = require('telegram/types/message');
const VerbsHelper = require('telegram/helpers/verbs');
const _ = require('lodash');

class Idle {
    constructor(server, bot) {
        this.server = server;
        this.bot = bot;

        let VerbsHelper = this.server.plugins.helpers.VerbsHelper;

        this.verbsHelper = new VerbsHelper(this.server.KB.VERBS);

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

module.exports = function(server, bot) {
    return new Idle(server, bot);
}