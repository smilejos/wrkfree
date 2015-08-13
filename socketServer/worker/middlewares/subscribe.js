/**
 * NOTE: 
 * based on socketCluster, all message, activities, notifications traveling
 * through client and server are part of "CHANNEL SYSTEM".
 * we must define our subscription rule to fit this.
 * TYPE1: prefix with "user"
 * e.g. subscribeReq = user:UID, means the specific mailbox of user, only user himself can
 *     subscribe this channel.
 *
 * TYPE2: prefix with "channel"
 * e.g. subscribeReq = channel:CHANNELID, means specific channel frequency, users that subscribe this
 *     channel can get messages realtime.
 *     
 * TYPE3: prefix with "activity"
 * e.g. subscribeReq = activity:UID, the users's activity channel, only target user's friend
 *      can subscribe it. all target user's activities will broadcast there
 *      
 * TYPE4: prefix with "notification"
 * e.g. subscribeReq = notification:CHANNELID, the channel's notifications broadcast channel, 
 *     user can get specific channel's notification when he star a channel.
 */
'use strict';
var Promise = require('bluebird');
var StorageManager = require('../../../storageService/storageManager');
var SharedUtils = require('../../../sharedUtils/utils');
var LogUtils = require('../../../sharedUtils/logUtils');
var LogCategory = 'SOCKET';

var AuthHandlers = {
    user: _getUserAuthAsync,
    activity: _getFriendAuthAsync,
    channel: _getChannelAuthAsync,
    notification: _getNotificationAuthAsync
};

/*
 * @Description: All subscribe middlewares has three arguments
 *
 * @param {Object}        socket, the server socket object
 * @param {Object}        channel, the channel request string
 * @param {Function}      next, for calling next middleware
 */

/**
 * @Author: George_Chen
 * @Description: to check socket client can subscribing self channel or not
 * @param {String}        uid, the user id
 * @param {String}        targetUid, target user's id 
 */
function _getUserAuthAsync(uid, targetUid) {
    return Promise.try(function() {
        return (uid === targetUid);
    });
}

/**
 * @Author: George_Chen
 * @Description: to check asker can subscribe to channel or not
 * @param {String}        uid, the user id
 * @param {String}        channelId, channel's id
 */
function _getChannelAuthAsync(uid, channelId) {
    var channelStorage = StorageManager.getService('Channel');
    return channelStorage.getAuthAsync(uid, channelId)
        .then(function(isAuth) {
            if (isAuth) {
                channelStorage.visitChannelAsync(uid, channelId);
            }
            return isAuth;
        });
}

/**
 * @Author: George_Chen
 * @Description: to check asker can subscribe to target user's activities or not
 * @param {String}        uid, the user id
 * @param {String}        friendUid, friend's uid
 */
function _getFriendAuthAsync(uid, friendUid) {
    var friendStorage = StorageManager.getService('Friend');
    return friendStorage.hasFriendshipAsync(uid, friendUid);
}

/**
 * @Author: George_Chen
 * @Description: to check asker can subscribe to channel notifications or not
 * @param {String}        uid, the user id
 * @param {String}        channelId, channel's id
 */
function _getNotificationAuthAsync(uid, channelId) {
    var channelStorage = StorageManager.getService('Channel');
    return channelStorage.hasStarredAsync(uid, channelId);
}

/************************************************
 *
 *           Public APIs
 *
 ************************************************/

/**
 * Public API
 * @Author: George_Chen
 * @Description: to check socket client has valid socket token or not
 */
exports.ensureLogin = function(socket, channel, next) {
    if (SharedUtils.isMd5Hex(socket.getAuthToken())) {
        return next();
    }
    LogUtils.warn(LogCategory, {
        pubsubChannel: channel
    }, '[' + socket.id + '] did not get token before subscribe request');
    next('reject subscribe request');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to check channel argument is valid or not
 */
exports.vertifyArgument = function(socket, channel, next) {
    if (SharedUtils.isString(channel)) {
        return next();
    }
    LogUtils.warn(LogCategory, {
        pubsubChannel: channel,
        uid: socket.getAuthToken()
    }, '[' + socket.id + '] vertify request argument fail');
    next('reject subscribe request');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to check current client has auth to subscribe specific channel or not
 */
exports.ensureAuthed = function(socket, channel, next) {
    var uid = socket.getAuthToken();
    var request = channel.split(':');
    var handler = AuthHandlers[request[0]];
    var errData = {
        pubsubChannel: channel,
        uid: socket.getAuthToken()
    };
    if (!handler) {
        LogUtils.warn(LogCategory, errData, '[' + socket.id + '] subscribed type not supported');
        return next('reject subscribe request');
    }
    return handler(uid, request[1])
        .then(function(isAuth) {
            if (!isAuth) {
                var msg = (isAuth === null ? 'subscribe fail on storage service' : 'authorization failure');
                LogUtils.warn(LogCategory, errData, '[' + socket.id + '] ' + msg);
                return next('reject subscribe request');
            }
            return next();
        }).catch(function(err) {
            errData.error = err.toString();
            LogUtils.error(LogCategory, errData, '[' + socket.id + '] got server error');
            return next('reject subscribe request');
        });
};
