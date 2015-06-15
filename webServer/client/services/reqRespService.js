'use strict';
var SocketManager = require('./socketManager');
var SocketUtils = require('./socketUtils');
var SharedUtils = require('../../../sharedUtils/utils');
var OnNotify = require('../actions/onNotify');

/**
 * triggered when user receive new request or response 
 */
exports.onReqResp = function() {
    SocketUtils.execAction(OnNotify, {
        type: 'reqResp'
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to send channel request
 *
 * @param {String}          data.targetUser, the uid of target user
 * @param {String}          data.channelId, the channel id
 */
exports.channelReqAsync = function(data) {
    var packet = _setPacket('channelReqAsync', null, data);
    return _request(packet, 'channelReqAsync');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for channel host to response the request of channel
 *
 * @param {String}          data.reqId, the request id
 * @param {String}          data.respTarget, the uid of response target
 * @param {Boolean}         data.isPermitted, the answer from host
 * @param {String}          data.channelId, the channel id
 */
exports.channelRespAsync = function(data) {
    var packet = _setPacket('channelRespAsync', null, data);
    return _request(packet, 'channelRespAsync');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to send friend request
 *
 * @param {String}          data.targetUser, the uid of target user
 */
exports.friendReqAsync = function(data) {
    var packet = _setPacket('friendReqAsync', null, data);
    return _request(packet, 'friendReqAsync');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to response friend request
 *
 * @param {String}          data.reqId, the request id
 * @param {String}          data.respTarget, the uid of response target
 * @param {Boolean}         data.isPermitted, the answer from host
 */
exports.friendRespAsync = function(data) {
    var packet = _setPacket('friendRespAsync', null, data);
    return _request(packet, 'friendRespAsync');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to check status of channel request (sent or not)
 *
 * @param {String}          data.targetUser, the uid of target user
 * @param {String}          data.channelId, the channel id
 */
exports.isChannelReqSentAsync = function(data) {
    var packet = _setPacket('isChannelReqSentAsync', null, data);
    return _request(packet, 'isChannelReqSentAsync');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to check status of friend request (sent or not)
 *
 * @param {String}          data.targetUser, the uid of target user
 */
exports.isFriendReqSentAsync = function(data) {
    var packet = _setPacket('isFriendReqSentAsync', null, data);
    return _request(packet, 'isFriendReqSentAsync');
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
            SharedUtils.printError('reqRespService.js', caller, err);
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
    return SocketUtils.setPacket('reqResp', serverApi, clientApi, data);
}
