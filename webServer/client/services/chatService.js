'use strict';
var SocketManager = require('./socketManager');
var SocketUtils = require('./socketUtils');
var SharedUtils = require('../../../sharedUtils/utils');
var RecvMessage = require('../actions/chat/recvMessage');
var RecvNotificationMsg = require('../actions/chat/recvNotificationMsg');

/**
 * Public API
 * @Author: George_Chen
 * @Description: for handling all chat received message from server
 * NOTE: the data is the same as packet.params setup at API "sendMsgAsync"
 *
 * @param {Object}          data, the message data from server
 */
exports.receiveMsg = function(data) {
    var packet = _setPacket('readMsgAsync', null, {
        channelId: data.channelId
    });
    return _request(packet, 'receiveMsg')
        .then(function(){
            return SocketUtils.execAction(RecvMessage, data, 'receiveMsg');
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description:
 *
 * @param {Object}          data, the message data from server
 */
exports.recvNotificationMsg = function(data) {
    return SocketUtils.execAction(RecvNotificationMsg, data, 'recvNotificationMsg');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to sending chat message to specific channel
 * 
 * @param {Object}          data, the message data from server
 */
exports.sendMsgAsync = function(data) {
    var packet = _setPacket('sendMsgAsync', null, data);
    return _request(packet, 'sendMsgAsync');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to get chat messages on current channel
 *         NOTE: if get success, send a ack packet back to server
 *         
 * @param {Object}          data, the message data from server
 */
exports.getChannelMsgAsync = function(data) {
    var packet = _setPacket('getMsgAsync', null, data);
    return _request(packet, 'getChannelMsgAsync')
        .then(function(msgs) {
            if (msgs.length > 0) {
                var ackPacket = _setPacket('readMsgAsync', null, {
                    channelId: data.channelId
                });
                _request(ackPacket, 'getChannelMsgAsync');
            }
            return msgs;
        }).catch(function(err) {
            SharedUtils.printError('chatService.js', 'getChannelMsgAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to get last message on a group of channels
 *       
 * @param {Object}          socket, the client socket instance
 * @param {Array}           data.channels, an array of channelIds
 */
exports.getLastMsgsAsync = function(data) {
    var packet = _setPacket('getLastMsgsAsync', null, data);
    return _request(packet, 'getLastMsgsAsync');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to find unread message counts on user starred(subscribed) channels
 *       
 * @param {Object}          socket, the client socket instance
 */
exports.getUnreadSubscribedMsgCounts = function() {
    var packet = _setPacket('getUnreadSubscribedMsgCounts', null);
    return _request(packet, 'getUnreadSubscribedMsgCounts');
};

/************************************************
 *
 *           internal functions
 *
 ************************************************/

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
            SharedUtils.printError('chatService.js', caller, err);
            return null;
        });
}

/**
 * @Author: George_Chen
 * @Description: a sugar sytanx function for handling socekt publish
 *              events on drawService
 *         NOTE: caller is just for print error log; if error happen,
 *              we can know the root cause from which caller
 *
 * @param {String}          subscription, socketCluster subscription
 * @param {Object}          packet, the packet for request
 * @param {String}          caller, the caller function name
 */
function _publish(subscription, packet, caller) {
    return SocketManager.publishAsync(subscription, packet)
        .catch(function(err) {
            SharedUtils.printError('chatService.js', caller, err);
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
    return SocketUtils.setPacket('chat', serverApi, clientApi, data);
}
