'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');
var StorageManager = require('../../../storageService/storageManager');
var MsgStorage = StorageManager.getService('Msg');

/**
 * Public API
 * @Author: George_Chen
 * @Description: for handling the message send request from client
 *       
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, the channel id
 * @param {String}          data.message, the message content
 * @param {String}          data.from, the sender uid
 */
exports.sendMsgAsync = function(socket, data) {
    return Promise.join(
        SharedUtils.argsCheckAsync(data.from, 'md5'),
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        SharedUtils.argsCheckAsync(data.message, 'string'),
        function(sender, channelId, msg) {
            return MsgStorage.saveAsync(sender, channelId, msg);
        }).then(function(saveResult) {
            if (saveResult === null) {
                throw new Error('fail to save new sent message on storage service');
            }
            saveResult.sentTime = new Date(saveResult.sentTime).getTime();
            socket.global.publish('notification:' + data.channelId, {
                clientHandler: 'recvNotificationMsg',
                service: 'chat',
                params: saveResult
            });
            socket.global.publish('channel:' + data.channelId, {
                clientHandler: 'receiveMsg',
                service: 'chat',
                params: saveResult,
                socketId: socket.id
            });
            return {
                sentTime: saveResult.sentTime
            };
        }).catch(function(err) {
            SharedUtils.printError('chatHandler.js', 'sendMsgAsync', err);
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to get channel messages, use data.period can give 
 *               time restriction on query result
 *       
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, the channel id
 * @param {Object}          data.period, optional for time restriction
 *                          data.period.start, the start time of that period
 *                          data.period.end, the end time of that period
 */
exports.getMsgAsync = function(socket, data) {
    var uid = socket.getAuthToken();
    return Promise.join(
        SharedUtils.argsCheckAsync(uid, 'md5'),
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        data.period,
        function(validUid, validChannelId, period) {
            return MsgStorage.pullAsync(validUid, validChannelId, period);
        }).then(function(result) {
            var errMsg = 'fail to get previous messages on storage service';
            return SharedUtils.checkExecuteResult(result, errMsg);
        }).catch(function(err) {
            SharedUtils.printError('chatHandler.js', 'getMsgAsync', err);
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: handling the user message read ack request on specific channel
 *       
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, the channel id
 */
exports.readMsgAsync = function(socket, data) {
    var uid = socket.getAuthToken();
    return Promise.join(
        SharedUtils.argsCheckAsync(uid, 'md5'),
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        function(validUid, validChannelId) {
            return MsgStorage.readAckAsync(validUid, validChannelId);
        }).then(function(result) {
            var errMsg = 'update message read ack fail on storage service';
            return SharedUtils.checkExecuteResult(result, errMsg);
        }).catch(function(err) {
            SharedUtils.printError('chatHandler.js', 'readMsgAsync', err);
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for getting last message of channels
 *       
 * @param {Object}          socket, the client socket instance
 * @param {Array}           data.channels, an array of channelIds
 */
exports.getLastMsgsAsync = function(socket, data) {
    return Promise.map(data.channels, function(cid) {
        return SharedUtils.argsCheckAsync(cid, 'md5');
    }).then(function(cids) {
        var uid = socket.getAuthToken();
        return MsgStorage.getLatestAsync(uid, cids);
    }).then(function(channelsMsg) {
        var errMsg = 'fail to get channels last message on storage service';
        return SharedUtils.checkExecuteResult(channelsMsg, errMsg);
    }).catch(function(err) {
        SharedUtils.printError('chatHandler.js', 'getLastMsgsAsync', err);
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to find unread message counts on user starred(subscribed) channels
 *       
 * @param {Object}          socket, the client socket instance
 */
exports.getUnreadSubscribedMsgCounts = function(socket) {
    var uid = socket.getAuthToken();
    return MsgStorage.getUnreadSubscribedMsgCountsAsync(uid)
        .then(function(messageCounts) {
            var errMsg = 'fail to count channels unread messages on storage service';
            return SharedUtils.checkExecuteResult(messageCounts, errMsg);
        }).catch(function(err) {
            SharedUtils.printError('chatHandler.js', 'getUnreadSubscribedMsgCounts', err);
            throw err;
        });
};
