'use strict';
var SocketManager = require('./socketManager');
var SocketUtils = require('./socketUtils');
var SharedUtils = require('../../../sharedUtils/utils');
var Promise = require('bluebird');

var OnNotificationAction = require('../actions/onNotification');

exports.onNotification = function(data) {
    SocketUtils.execAction(OnNotificationAction, data, 'onNotification');
};

/**
 * the Users info cache on browser
 */
var Users = {};

/**
 * Public API
 * @Author: George_Chen
 * @Description: get user info by the uid
 *
 * @param {String}          uid, user's id
 */
exports.getInfoAsync = function(uid) {
    return SharedUtils.argsCheckAsync(uid, 'md5')
        .then(function(validUid) {
            var info = Users[validUid];
            return (!!info ? info : _getInfoRemote(validUid));
        }).catch(function(err) {
            SharedUtils.printError('userService.js', 'getUserAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: get the userInfo of group of users
 *
 * @param {Array}          users, group of user ids
 */
exports.getGroupInfoAsync = function(users) {
    return Promise.filter(users, function(uid) {
        if (!SharedUtils.isMd5Hex(uid)) {
            throw new Error('invalid uid');
        }
        return !Users[uid];
    }).then(function(remoteQueries) {
        return (remoteQueries.length === 0 ? [] : _getInfoRemote(remoteQueries));
    }).then(function() {
        var results = {};
        SharedUtils.fastArrayMap(users, function(uid) {
            results[uid] = Users[uid];
        });
        return results;
    }).catch(function(err) {
        SharedUtils.printError('userService.js', 'getGroupInfoAsync', err);
        return null;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: use query string to find search users
 *
 * @param {String}        data.queryStr, the query string
 */
exports.searchAsync = function(data) {
    var packet = _setPacket('searchAsync', null, data);
    return _request(packet, 'searchAsync');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: get user notifications.
 *         NOTE: if data.isReaded is not set, default will query all notifications
 *
 * @param {Object}          socket, the client socket instance
 * @param {Boolean}         data.isReaded, notification status (optional)
 */
exports.getNotificationsAsync = function(data) {
    var packet = _setPacket('getNotificationsAsync', null, data);
    return _request(packet, 'getNotificationsAsync');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to reset unread tips on current user's header;
 *         NOTE: data.tipsType only allowed 'notice', 'friendMsg', 'subscribedMsg'
 *
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.tipsType, the target tips type
 */
exports.resetUnreadNoticeAsync = function(data) {
    var packet = _setPacket('resetUnreadNoticeAsync', null, data);
    return _request(packet, 'resetUnreadNoticeAsync');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to set his/her dashboard layout
 *
 * @param {Boolean}         data.isDashboardGrid, to indicate layout is grid or not
 */
exports.setDashboardLayoutAsync = function(data) {
    var packet = _setPacket('setDashboardLayoutAsync', null, data);
    return _request(packet, 'setDashboardLayoutAsync');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: polyfill the user info to local cache
 *
 * @param {Array/Object}          userInfos, can be a user info json or group of userInfos
 */
exports.polyfillAsync = function(userInfos) {
    var isUsers = SharedUtils.isArray(userInfos);
    return (isUsers ? Promise.map(userInfos, _cacheInfo) : _cacheInfo(userInfos))
        .catch(function(err) {
            SharedUtils.printError('userService.js', 'polyfillAsync', err);
            return null;
        });
};

/************************************************
 *
 *           internal functions
 *
 ************************************************/

/**
 * @Author: George_Chen
 * @Description: get the target user(users) info from server
 *
 * @param {Array/String}          user, can be a uid or group of uids
 */
function _getInfoRemote(user) {
    var packet = _setPacket('getInfoAsync', null, {
        users: user
    });
    return _request(packet, '_getInfoRemote')
        .then(function(result) {
            var isUsers = SharedUtils.isArray(user);
            return (isUsers ? Promise.map(result, _cacheInfo) : _cacheInfo(result));
        });
}

/**
 * @Author: George_Chen
 * @Description: cache the user info json to the local user cache
 *
 * @param {Object}          info, the user info json object
 */
function _cacheInfo(info) {
    return Promise.props({
        uid: SharedUtils.argsCheckAsync(info.uid, 'md5'),
        nickName: SharedUtils.argsCheckAsync(info.nickName, 'nickName'),
        avatar: SharedUtils.argsCheckAsync(info.avatar, 'avatar')
    }).then(function(validInfo) {
        Users[validInfo.uid] = validInfo;
        return validInfo;
    });
}

/**
 * @Author: George_Chen
 * @Description: a sugar sytanx function for handling socekt request
 *              events on drawService
 *         NOTE: caller is just for print error log; if error happen,
 *              we can know the root cause from which caller
 *       
 * @param {Object}          packet, the packet for request
 * @param {String}          caller, the caller function name
 */
function _request(packet, caller) {
    return SocketManager.requestAsync(packet)
        .catch(function(err) {
            SharedUtils.printError('userService.js', caller, err);
            return null;
        });
}

/**
 * @Author: George_Chen
 * @Description: a sugar sytanx function for wrap the socket formated
 *               packet
 *
 * @param {String}          serverApi, the server handler api
 * @param {String}          clientApi, the client receiver api
 * @param {Object}          data, the request parameters
 */
function _setPacket(serverApi, clientApi, data) {
    return SocketUtils.setPacket('user', serverApi, clientApi, data);
}
