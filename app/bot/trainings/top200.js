'use strict';

class Top200 {
    constructor(KB) {
        this.KB = KB;

        this.ACTIVE = false;
        this.TYPE = 'TOP200';
        this.LABEL = 'Топ 200';
        this.DESCRIPTION = 'топ 200 слов в немецком языке';
        this.ITERATIONS = 5;
    }
}

module.exports = function (KB) {
    return new Top200(KB);
};