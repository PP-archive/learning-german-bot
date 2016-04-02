'use strict';

class Top100 {
    constructor(KB) {
        this.KB = KB;

        this.ACTIVE = false;
        this.TYPE = 'TOP100';
        this.LABEL = 'Топ 100';
        this.DESCRIPTION = 'топ 100 слов в немецком языке';
        this.ITERATIONS = 5;
    }
}

module.exports = function (KB) {
    return new Top100(KB);
};