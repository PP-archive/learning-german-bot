'use strict';

class Abstract {
    static get LOCALES(){
        return ['en-US', 'ru-RU'];
    }

    static get ACTIVE() {
        return true;
    }
    
    constructor(KB, i18n, locale) {
        this.KB = KB;
        this.locale = locale;

        // setting up the i18n
        this.i18n = {};
        i18n.init({ headers: {} }, this.i18n);
        this.i18n.setLocale(this.locale);
    }
}

module.exports = Abstract;