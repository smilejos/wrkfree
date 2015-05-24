'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var UserService = require('../../services/userService');
var ChannelService = require('../../services/channelService');
var FriendStore = require('../../../shared/stores/friendStore');
var QuickSearchStore = require('../../../shared/stores/QuickSearchStore');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: action for user to trigger quickSearch
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.query, the query string of quickSearch
 */
module.exports = function(actionContext, data) {
    var quickSearchStore = actionContext.getStore(QuickSearchStore);
    if (data.query === '' || quickSearchStore.hasCached(data.query)) {
        return actionContext.dispatch('ON_QUICKSEARCH_CACHE_HIT', data.query);
    }
    return Promise.props({
        queryStr: SharedUtils.argsCheckAsync(data.query, 'string')
    }).then(function(reqData) {
        return Promise.join(
            _searchChannel(actionContext, reqData),
            _searchUser(actionContext, reqData),
            function(channelResults, userResults) {
                actionContext.dispatch('ON_QUICKSEARCH_UPDATE', {
                    query: reqData.queryStr,
                    users: userResults,
                    channels: channelResults
                });
            });
    }).catch(function(err) {
        SharedUtils.printError('quickSearch.js', 'core', err);
    });
};

/**
 * @Author: George_Chen
 * @Description: use to trigger user search
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Object}      Object, the request data for searching users
 */
function _searchUser(actionContext, reqData) {
    var friendStore = actionContext.getStore(FriendStore);
    return UserService.searchAsync(reqData)
        .map(function(info) {
            info.isKnown = friendStore.hasFriendShip(info.uid);
            return info;
        }).then(function(users) {
            var uids = SharedUtils.fastArrayMap(users, function(info) {
                return info.uid;
            });
            return {
                keys: uids,
                results: users
            };
        });
}

/**
 * @Author: George_Chen
 * @Description: use to trigger channel search
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Object}      Object, the request data for searching channels
 */
function _searchChannel(actionContext, reqData) {
    return ChannelService.searchAsync(reqData)
        .map(function(channel) {
            return UserService.getInfoAsync(channel.host)
                .then(function(info) {
                    info.extraInfo = channel.name;
                    info.channelId = channel.channelId;
                    info.isKnown = channel.isKnown;
                    return info;
                });
        }).then(function(channels) {
            var cids = SharedUtils.fastArrayMap(channels, function(info) {
                return info.channelId;
            });
            return {
                keys: cids,
                results: channels
            };
        });
}
