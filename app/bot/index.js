'use strict';

const TelegramBot = require('node-telegram-bot-api');
const _ = require('lodash');
const config = require('config');
const debug = require('debug')('bot');

const yaml = require('js-yaml');
const fs = require('fs');

/**
 * Gathering the knowledge base
 */
let KB = {}
KB.VERBS = yaml.safeLoad(fs.readFileSync('./kb/verbs.yaml', 'utf8'));

exports.register = function (server, options, next) {
    let bot = new TelegramBot(config.get('token'));

    let url = config.get('baseUrl');
    let crt = config.has('crt') ? config.get('crt') : undefined;

    debug(`Setting the webHook: url: ${url}, crt: ${crt}`);
    bot.setWebHook(url, crt);

    server.decorate('server', 'bot', bot);

    bot.onText(/\/verb (.+)/, function (msg, match) {
        let query = match[1];
        let response = '';

        if (_.has(KB.VERBS, query)) {
            let verb = KB.VERBS[query];
            response += `Глагол <code>${query}</code>.\n\n`;

            if (_.has(verb, 'case government')) {
                response += `Управление: \n`;

                let i = 1;
                _.forEach(_.get(verb, 'case government'), (value, key) => {
                    response += `${i}. <b>${key}</b>`;

                    // translation
                    response += value.translation ? ` (${value.translation})` : '';
                    response += value.example ? `\n<i>Пример: ${value.example}</i>` : ``;
                    response += `\n`;

                    i++;
                });
            }
        } else {
            response = `Увы, глагола "${query}" не найдено`;
        }

        var chatId = msg.chat.id;
        var resp = match[1];
        bot.sendMessage(chatId, response, { parse_mode: 'HTML' });
    });

    next();
};

exports.register.attributes = {
    name: 'bot',
    dependencies: ['web/index']
};