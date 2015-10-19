'use strict';

/**
 * parser is used to parse search results from different collections
 */
var Parsers = {
    users: function(info) {
        info._source.uid = info._id;
        return info._source;
    },
    channels: function(info) {
        info._source.channelId = info._id;
        return info._source;
    }
};

/**
 * expression is a formatted query json which can be accepted by elasticsearch server
 */
var Expression = {
    users: function(text) {
        return {
            query: {
                multi_match: {
                    query: text,
                    type: 'phrase_prefix',
                    fields: ['giveName', 'familyName', 'nickName'],
                    prefix_length: 3,
                    max_expansions: 10
                }
            }
        };
    },
    channels: function(text) {
        return {
            query: {
                match: {
                    name: {
                        query: text,
                        type: 'phrase_prefix',
                        prefix_length: 2,
                        max_expansions: 10
                    }
                }
            }
        };
    }
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to get the search result parser based on collection
 *
 * @param {String}      collection, the mongo collection name
 */
exports.getParser = function(collection) {
    return Parsers[collection];
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to get the search query expression based on collection
 *
 * @param {String}      collection, the mongo collection name
 */
exports.getQueryExpression = function(collection, text) {
    var handler = Expression[collection];
    return (!handler ? null : handler(text));
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: used for indexing db item into es search
 *
 * @param {String}      table, the db table name
 * @param {String}      indexId, the item index id
 * @param {Object}      source, the item source object
 */
exports.getIndexExpression = function(table, indexId, source) {
    return {
        index: 'wrkfree',
        type: table,
        id: indexId,
        body: source
    };
};
