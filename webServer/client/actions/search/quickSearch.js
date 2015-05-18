'use strict';
var SharedUtils = require('../../../../sharedUtils/utils');
var UserService = require('../../services/userService');
var ChannelService = require('../../services/channelService');
var FriendStore = require('../../../shared/stores/friendStore');
var Promise = require('bluebird');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: action for user to trigger quickSearch
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.query, the query string of quickSearch
 * @param {String}      data.type, the target type on this search
 */
module.exports = function(actionContext, data) {
    if (data.query === '') {
        return actionContext.dispatch('ON_QUICKSEARCH_UPDATE', {
            users: [],
            channels: []
        });
    }
    return Promise.props({
        queryStr: SharedUtils.argsCheckAsync(data.query, 'string')
    }).then(function(reqData) {
        if (data.type === 'channel') {
            return _searchChannel(actionContext, reqData);
        }
        if (data.type === 'user') {
            return _searchUser(actionContext, reqData);
        }
        throw new Error('not supported type');
    }).catch(function(err) {
        SharedUtils.printError('quickSearch.js', 'core', err);
        return null;
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
            info.type = 'user';
            info.isKnown = friendStore.hasFriendShip(info.uid);
            return info;
        }).then(function(data) {
            return actionContext.dispatch('ON_QUICKSEARCH_UPDATE', {
                users: data
            });
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
                    info.type = 'channel';
                    info.extraInfo = channel.name;
                    info.isKnown = channel.isKnown;
                    return info;
                });
        }).then(function(data) {
            return actionContext.dispatch('ON_QUICKSEARCH_UPDATE', {
                channels: data
            });
        });
}
