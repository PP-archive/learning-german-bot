'use strict';

const MessageTypes = require('telegram/types/message');
const Promise = require('bluebird');

const Abstract = require('./_abstract');

class Help extends Abstract {
    constructor(server, bot) {
        super(server, bot);
    }

    process() {
        // in order to be able to call super method inside the coroutine
        return Promise.coroutine(function *() {
            const { i18n } = this.chat;

            let text, options = {
                parse_mode: 'HTML',
                reply_markup: {
                    hide_keyboard: true
                }
            };

            text = `${i18n.__('You can use Bot the next way:')}
1. ${i18n.__('<code>[something]</code> - Bot will try to guess what have you asked for. Example: <pre>sprechen</pre>.')}
2. ${i18n.__('/verb [verb] - everything about the verb. Example: <pre>/verb sprechen</pre>.')}
3. ${i18n.__('/training - train yourself! Learn TOP 200 german words or case government.')}
4. ${i18n.__('/cancel - stop the training.')}
5. ${i18n.__('/help - how to use Bot.')}
6. ${i18n.__('/about - about Bot in general.')}
7. ${i18n.__('/stats - bot\'s statistics.')}
8. ${i18n.__('/sources - source code of Bot.')}`;

            return [{ type: MessageTypes.MESSAGE, text: text, options: options }];
        }).bind(this)();
    }
}

module.exports = Help;