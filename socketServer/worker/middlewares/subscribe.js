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
 * @param {String}        targetUid, target user's id 
 */
function _getFriendAuthAsync() {
    // TODO:
    // check is friends or not
}

/**
 * @Author: George_Chen
 * @Description: to check asker can subscribe to channel notifications or not
 * @param {Object}        socket, server socket object
 * @param {String}        channelId, channel's id
 */
function _getNotificationAuthAsync() {
    // TODO:
    // check is member and is subscribed or not
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
