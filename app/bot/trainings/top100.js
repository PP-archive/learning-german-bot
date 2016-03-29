'use strict';

class Top100 {
    get ACTIVE() {
        return false;
    }
    
    get TYPE() {
        return 'TOP100';
    }

    get LABEL() {
        return 'Топ 100';
    }

    get ITERATIONS () {
        return 5;
    }

    constructor(KB) {
        this.KB = KB;
    }
}

module.exports = function (KB) {
    return new Top100(KB);
};