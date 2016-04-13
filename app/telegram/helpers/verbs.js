'use strict';

const Levenshtein = require('levenshtein');
const _ = require('lodash');

class VerbsHelper {
    constructor(VERBS) {
        this.VERBS = VERBS;
    }

    /**
     * Gather the suggestions for the particular verb
     * @param query
     * @returns {*}
     * @private
     */
    getVerbSuggestions(query) {
        query = query.toLowerCase();

        let distances = [];
        _.forEach(_.keys(this.VERBS), (value) => {
            // in case it's not one word
            if (value.indexOf(' ') !== -1) {
                let words = value.split(' ');
                // find the min distance all in all
                let distance = _(words)
                    .map((word) => {
                        return (new Levenshtein(word, query)).distance
                    })
                    .push((new Levenshtein(value, query)).distance)
                    .min();

                distances.push({ key: value, distance: distance });
            } else {
                distances.push({ key: value, distance: (new Levenshtein(value, query)).distance });
            }
        });

        let suggestions = _(distances)
            .filter((record) => {
                return record.distance <= 3;
            })
            .sortBy((record)=> {
                return record.distance;
            })
            .slice(0, 5)
            .sortBy((record)=> {
                return record.key;
            })
            .value();

        return suggestions;
    }

    /**
     * Test if query looks like the verb
     * @param query
     * @returns {boolean}
     * @private
     */
    testForVerb(query) {
        query = query.toLowerCase();

        if (_.has(this.VERBS, query)) {
            return true;
        } else {
            let suggestions = this.getVerbSuggestions(query);

            return !!suggestions.length;
        }

        return false;
    }
}

module.exports = VerbsHelper;