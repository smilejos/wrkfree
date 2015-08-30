'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var UserService = require('../../services/userService');
var FriendStore = require('../../../shared/stores/FriendStore');
var QuickSearchStore = require('../../../shared/stores/QuickSearchStore');
var SearchService = require('../../services/searchService');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: action for user to trigger quickSearch
 *         NOTE: we use first symbol of query string to distinguish
 *               what kind of search method that client want to use
 *
 *          e.g. '#': to search on channel, '@': to search on user
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.query, the query string of quickSearch
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        query: SharedUtils.argsCheckAsync(data.query, 'string')
    }).then(function(reqData) {
        var quickSearchStore = actionContext.getStore(QuickSearchStore);
        var text = reqData.query;
        if (text === '' || text === '#' || text === '@' || quickSearchStore.hasCached(text)) {
            return actionContext.dispatch('ON_QUICKSEARCH_CACHE_HIT', text);
        }
        switch (text[0]) {
            case '#':
                return _searchChannel(actionContext, reqData);
            case '@':
                return _searchUser(actionContext, reqData);
            default:
                return _search(actionContext, reqData);
        }
    }).then(function(result) {
        if (result) {
            actionContext.dispatch('ON_QUICKSEARCH_UPDATE', result);
        }
    }).catch(function(err) {
        SharedUtils.printError('quickSearch.js', 'core', err);
    });
};

/**
 * @Author: George_Chen
 * @Description: used to search on all the things
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Object}      reqData, the request data for searching
 */
function _search(actionContext, reqData) {
    return SearchService.searchAsync(reqData)
        .then(function(result) {
            return Promise.props({
                query: reqData.query,
                users: _polyfillUsers(result.users),
                channels: _polyfillChannels(result.channels)
            });
        });
}

/**
 * @Author: George_Chen
 * @Description: used to search directly on users
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Object}      reqData, the request data for searching
 */
function _searchUser(actionContext, reqData) {
    return SearchService.searchUserAsync(reqData)
        .then(function(result) {
            return Promise.props({
                query: reqData.query,
                users: _polyfillUsers(result),
                channels: _polyfillChannels([])
            });
        });
}

/**
 * @Author: George_Chen
 * @Description: used to search directly on channels
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Object}      reqData, the request data for searching
 */
function _searchChannel(actionContext, reqData) {
    return SearchService.searchChannelAsync(reqData)
        .then(function(result) {
            return Promise.props({
                query: reqData.query,
                users: _polyfillUsers([]),
                channels: _polyfillChannels(result)
            });
        });
}

/**
 * @Author: George_Chen
 * @Description: used to polyfill information on user search results
 * 
 * @param {String}      users, an array of search results on user
 */
function _polyfillUsers(users) {
    var friendStore = window.context.getStore(FriendStore);
    var uids = [];
    return Promise.map(users, function(user) {
        uids.push(user.uid);
        user.isKnown = friendStore.hasFriendShip(user.uid);
        return user;
    }).then(function(updateResults) {
        return {
            keys: uids,
            results: updateResults
        };
    });
}

/**
 * @Author: George_Chen
 * @Description: used to polyfill information on channel search results
 * 
 * @param {String}      channels, an array of search results on channel
 */
function _polyfillChannels(channels) {
    var cids = [];
    return Promise.map(channels, function(channel) {
        cids.push(channel.channelId);
        return UserService.getInfoAsync(channel.host)
            .then(function(info) {
                return {
                    uid: info.uid,
                    avatar: info.avatar,
                    nickName: info.nickName,
                    channelId: channel.channelId,
                    isKnown: channel.isKnown,
                    extraInfo: channel.name
                };
            });
    }).then(function(updateResults) {
        return {
            keys: cids,
            results: updateResults
        };
    });
}
