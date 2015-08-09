'use strict';
var SharedUtils = require('../../sharedUtils/utils');
var SearchAgent = require('../searches/SearchAgent');
var SearchHelper = require('../searches/SearchHelper');

/**
 * Public API
 * @Author: George_Chen
 * @Description: used to directly search users
 *
 * @param {String}      queryText, the string used to find user
 */
exports.searchUserAsync = function(queryText) {
    var collection = 'users';
    return _singleSearch(collection, queryText, 'searchUserAsync');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: used to directly search channels
 *
 * @param {String}      queryText, the string used to find user
 */
exports.searchChannelAsync = function(queryText) {
    var collection = 'channels';
    return _singleSearch(collection, queryText, 'searchChannelAsync');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: used to peform universal search service
 *
 * @param {String}      queryText, the string used to find user
 */
exports.searchAsync = function(queryText) {
    var queries = [{
        collection: 'users',
        query: SearchHelper.getQueryExpression('users', queryText)
    }, {
        collection: 'channels',
        query: SearchHelper.getQueryExpression('channels', queryText)
    }];
    return SearchAgent.multiSearchAsync(queries)
        .then(function(results) {
            var formattedResult = {};
            var parser = null;
            var type = '';
            SharedUtils.fastArrayMap(results, function(data) {
                var sources = data.hits.hits;
                SharedUtils.fastArrayMap(sources, function(info) {
                    type = info._type;
                    parser = SearchHelper.getParser(type);
                    if (!formattedResult[type]) {
                        formattedResult[type] = [];
                    }
                    formattedResult[type].push(parser(info));
                });
            });
            return formattedResult;
        }).catch(function(err) {
            SharedUtils.printError('SearchService.js', 'searchAsync', err);
            return null;
        });
};

/**
 * @Author: George_Chen
 * @Description: a low-level implementation of peforming single search
 *
 * @param {String}      collection, the mongo collection name
 * @param {String}      queryText, the string used to find user
 * @param {String}      caller, the caller of this API
 */
function _singleSearch(collection, queryText, caller) {
    var queryExpression = SearchHelper.getQueryExpression(collection, queryText);
    return SearchAgent.singleSearchAsync(collection, queryExpression)
        .then(function(result) {
            var parser = SearchHelper.getParser(collection);
            return SharedUtils.fastArrayMap(result, function(info) {
                return parser(info);
            });
        }).catch(function(err) {
            SharedUtils.printError('SearchService', caller, err);
            return null;
        });
}
