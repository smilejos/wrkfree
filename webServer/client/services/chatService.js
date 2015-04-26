'use strict';
var Promise = require('bluebird');
var SocketManager = require('./socketManager');
var SharedUtils = require('../../../sharedUtils/utils');
var recvMessage = require('../actions/chat/recvMessage');

/**
 * Public API
 * @Author: George_Chen
 * @Description: for handling all chat received message from server
 * NOTE: the data is the same as packet.params setup at API "sendMsgAsync"
 *
 * @param {Object}          data, the message data from server
 */
exports.receiveMsg = function(data) {;
    return window.context.executeAction(recvMessage, data);
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to sending chat message to specific channel
 * NOTE: here we assign "receiveMsg" as "clientHandler" on packet to inform other
 *       clients who receive this messsage can use "receiveMsg" function for handling
 * 
 * @param {Object}          data, the message data from server
 */
exports.sendMsgAsync = function(data) {
    var channel = _subscribeReq(data.channelId);
    var packet = {
        service: 'chat',
        api: 'sendMsgAsync',
        clientHandler: 'receiveMsg',
        params: data
    };
    return SocketManager.publishAsync(channel, packet)
        .catch(function(err) {
            SharedUtils.printError('chatService.js', 'sendMsgAsync', err);
            return null;
        });
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
    var packet = {
        service: 'chat',
        api: 'getMsgAsync',
        params: data
    };
    return SocketManager.requestAsync(packet)
        .then(function(msgs) {
            if (msgs.length > 0) {
                var ackPacket = {
                    service: 'chat',
                    api: 'readMsgAsync',
                    params: {
                        channelId: data.channelId
                    }
                };
                SocketManager.requestAsync(ackPacket);
            }
            return msgs;
        }).catch(function(err) {
            SharedUtils.printError('chatService.js', 'getChannelMsgAsync', err);
            return null;
        });
};

/**
 * @Author: George_Chen
 * @Description: to create the channel subscription request
 *
 * @param {String}        channelId, channel's id
 */
function _subscribeReq(channelId) {
    return 'channel:' + channelId;
}
