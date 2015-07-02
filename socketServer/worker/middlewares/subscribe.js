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
var SharedUtils = require('../../../sharedUtils/utils');
var StorageManager = require('../../../storageService/storageManager');
var Promise = require('bluebird');

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
 * @param {Object}        socket, server socket object
 * @param {String}        uid, target user's id 
 */
function _getUserAuthAsync(socket, uid) {
    var token = socket.getAuthToken();
    return Promise.try(function() {
        return (token === uid);
    });
}

/**
 * @Author: George_Chen
 * @Description: to check asker can subscribe to channel or not
 * @param {Object}        socket, server socket object
 * @param {String}        channelId, channel's id
 */
function _getChannelAuthAsync(socket, channelId) {
    var channelStorage = StorageManager.getService('Channel');
    var uid = socket.getAuthToken();
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
 * @param {Object}        socket, server socket object
 * @param {String}        friendUid, friend's uid
 */
function _getFriendAuthAsync(socket, friendUid) {
    var friendStorage = StorageManager.getService('Friend');
    var uid = socket.getAuthToken();
    return friendStorage.hasFriendshipAsync(uid, friendUid);
}

/**
 * @Author: George_Chen
 * @Description: to check asker can subscribe to channel notifications or not
 * @param {Object}        socket, server socket object
 * @param {String}        channelId, channel's id
 */
function _getNotificationAuthAsync(socket, channelId) {
    var channelStorage = StorageManager.getService('Channel');
    var uid = socket.getAuthToken();
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
 * @Description: check req cookie about web login state of current user
 * NOTE: only web login user is allowed to create socket
 *
 */
exports.ensureAuthed = function(socket, channel, next) {
    return Promise.try(function() {
        var request = channel.split(':');
        var handler = AuthHandlers[request[0]];
        if (!handler) {
            throw new Error('subscribed type not supported ');
        }
        return handler(socket, request[1]);
    }).then(function(isAuth) {
        return (isAuth ? next() : next('authorization failure'));
    }).catch(function(err) {
        SharedUtils.printError('subscribe.js', 'ensureAuthed', err);
        next('server error');
    });
};
