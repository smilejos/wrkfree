'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../sharedUtils/utils');


/**
 * Public API
 * @Author: George_Chen
 * @Description: getting the resource for route '/dashboard'
 *
 * @param {Object}      actionContext, fluxible actionContext
 * @param {Object}      routeInfo, route infomation for dashboard route
 */
exports.getDashboardAsync = function(actionContext, routeInfo) {
    var friendStorage = routeInfo.storageManager.getService('Friend');
    _setUserDashboardLayout(actionContext, routeInfo.user);
    return Promise.props({
        FriendStore: friendStorage.getFriendListAsync(routeInfo.user.uid, routeInfo.user.uid),
        HeaderStore: routeInfo.user,
        DashboardStore: _getChannelStreams(routeInfo.user.uid, routeInfo.storageManager)
    }).then(function(resource) {
        return _storesPolyfill(actionContext, resource);
    }).catch(function(err) {
        SharedUtils.printError('server-routeEntry', 'getDashboardAsync', err);
        return {};
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: getting the resource for route '/channel'
 *
 * @param {Object}      actionContext, fluxible actionContext
 * @param {Object}      routeInfo, route infomation for channel route
 */
exports.getWorkSpaceAsync = function(actionContext, routeInfo) {
    var storageManager = routeInfo.storageManager;
    var friendStorage = storageManager.getService('Friend');
    _setUserDashboardLayout(actionContext, routeInfo.user);
    return Promise.props({
        FriendStore: friendStorage.getFriendListAsync(routeInfo.user.uid, routeInfo.user.uid),
        HeaderStore: routeInfo.user,
        WorkSpaceStore: _getWorkSpace(routeInfo.user.uid, routeInfo.channelId, storageManager)
    }).then(function(resource) {
        return _storesPolyfill(actionContext, resource);
    }).catch(function(err) {
        SharedUtils.printError('server-routeEntry', 'getWorkSpaceAsync', err);
        return {};
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: getting the resoure for signup page
 *
 * @param {Object}      actionContext, fluxible actionContext
 * @param {Object}      params, params are object combined with routeInfo and urlInfo
 * NOTE: routeInfo is stored at routePlugin.js
 *       urlInfo is extract from react-router
 */
exports.getSignUpAsync = function(actionContext, routeInfo) {
    return Promise.try(function() {
        return _storesPolyfill(actionContext, {
            SignUpStore: routeInfo.userInfo
        });
    }).catch(function(err) {
        SharedUtils.printError('server-routeEntry', 'getSignUpAsync', err);
        return {};
    });
};

/**
 * @Author: George_Chen
 * @Description: to init the user dashboard layout on dashboardStore
 *
 * @param {Object}      actionContext, fluxible actionContext
 * @param {Object}      userInfo, the req.user object in express
 */
function _setUserDashboardLayout(actionContext, userInfo) {
    var DashboardStore = actionContext.getStore('DashboardStore');
    DashboardStore.setLayout({
        isDashboardGrid: userInfo.isDashboardGrid
    });
}

/**
 * @Author: George_Chen
 * @Description: polyfill each flux store based on storedata
 *
 * @param {Object}      actionContext, fluxible actionContext
 * @param {Object}      storeData, flux store datas
 */
function _storesPolyfill(actionContext, storeData) {
    return Promise.try(function() {
        return Object.keys(storeData);
    }).map(function(storeName) {
        var store = actionContext.getStore(storeName);
        if (storeData[storeName]) {
            return store.polyfillAsync(storeData[storeName]);
        }
        return null;
    }).catch(function(err) {
        SharedUtils.printError('server-routeEntry', '_storesPolyfill', err);
        return null;
    });
}

/**
 * Public API
 * @Author: George_Chen
 * @Description: for getting stream of user's authorized channels
 *
 * @param {String}      uid, user's id
 * @param {Object}      storageManager, storageManager instance
 */
function _getChannelStreams(uid, storageManager) {
    var channelStorage = storageManager.getService('Channel');
    return Promise.props({
        channels: channelStorage.getAuthChannelsAsync(uid)
    });
}

/**
 * Public API
 * @Author: George_Chen
 * @Description: for getting the workspace resource for polyfill
 *
 * @param {String}      uid, user's id
 * @param {String}      channelId, channel's id
 * @param {Object}      storageManager, storageManager instance
 */
function _getWorkSpace(uid, channelId, storageManager) {
    var channelStorage = storageManager.getService('Channel');
    return channelStorage.getAuthAsync(uid, channelId)
        .then(function(isAuth) {
            if (!isAuth) {
                throw new Error('not auth to get channel resource');
            }
            return Promise.props({
                channel: channelStorage.getChannelInfoAsync(channelId),
                members: channelStorage.getMembersAsync(channelId),
                status: channelStorage.getMemberStatusAsync(uid, channelId)
            });
        });
}
