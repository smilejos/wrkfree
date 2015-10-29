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
        DashboardStore: _getChannelStreams(routeInfo.user.uid, routeInfo.storageManager),
        SubscriptionStore: _getStarredChannels(routeInfo.user.uid, routeInfo.storageManager)
    }).then(function(resource) {
        return _storesPolyfill(actionContext, resource);
    }).catch(function(err) {
        SharedUtils.printError('server-routeEntry', 'getDashboardAsync', err);
        throw err;
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
        WorkSpaceStore: _getWorkSpace(routeInfo.user.uid, routeInfo.channelId, storageManager, routeInfo.boardIdx),
        SubscriptionStore: _getStarredChannels(routeInfo.user.uid, routeInfo.storageManager)
    }).then(function(resource) {
        return _storesPolyfill(actionContext, resource);
    }).catch(function(err) {
        SharedUtils.printError('server-routeEntry', 'getWorkSpaceAsync', err);
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for getting error route resource
 *         NOTE: currently we only polyfill current user information
 *
 * @param {Object}      actionContext, fluxible actionContext
 * @param {Object}      routeInfo, route infomation for logiin user
 */
exports.getErrorAsync = function(actionContext, routeInfo) {
    return Promise.props({
        HeaderStore: routeInfo.user
    }).then(function(resource) {
        return _storesPolyfill(actionContext, resource);
    }).catch(function(err) {
        SharedUtils.printError('server-routeEntry', 'getErrorAsync', err);
        throw err;
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
        throw err;
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
        if (!storeData[storeName]) {
            throw new Error('the data in store [' + storeName + '] is invalid');
        }
        var store = actionContext.getStore(storeName);
        return store.polyfillAsync(storeData[storeName]);
    }).catch(function(err) {
        SharedUtils.printError('server-routeEntry', '_storesPolyfill', err);
        throw new Error('store polyfill on server fail');
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
    var userStorage = storageManager.getService('User');
    return channelStorage.getAuthChannelsAsync(uid)
        .then(function(result) {
            return {
                channels: result
            };
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
function _getWorkSpace(uid, channelId, storageManager, boardIdx) {
    var channelStorage = storageManager.getService('Channel');
    return channelStorage.getAuthAsync(uid, channelId)
        .then(function(isAuth) {
            if (!isAuth) {
                throw new Error('not auth to get channel resource');
            }
            return Promise.props({
                channel: channelStorage.getChannelInfoAsync(channelId),
                members: channelStorage.getMembersAsync(channelId),
                status: channelStorage.getMemberStatusAsync(uid, channelId),
                params: {
                    channelId: channelId,
                    boardIdx: boardIdx
                }
            }).then(function(resource) {
                var props = Object.keys(resource);
                SharedUtils.fastArrayMap(props, function(prop) {
                    if (prop === null) {
                        throw new Error('getting workspace resource fail on storage service');
                    }
                });
                return resource;
            });
        });
}

/**
 * Public API
 * @Author: George_Chen
 * @Description: for getting user's starred channels as subscription list
 *
 * @param {String}      uid, user's id
 * @param {Object}      storageManager, storageManager instance
 */
function _getStarredChannels(uid, storageManager) {
    var channelStorage = storageManager.getService('Channel');
    var userStorage = storageManager.getService('User');
    return channelStorage.getStarredChannelsAsync(uid)
        .map(function(doc) {
            return userStorage.getUserAsync(doc.host)
                .then(function(hostInfo) {
                    if (hostInfo === null) {
                        throw new Error('fail to get host info on storage service');
                    }
                    doc.hostInfo = hostInfo;
                    delete doc.host;
                    return doc;
                });
        }).then(function(result) {
            return {
                channels: result
            };
        });
}
