'use strict';
var SharedUtils = require('../../../sharedUtils/utils');
var SocketManager = require('./socketManager');
var SocketUtils = require('./socketUtils');
var RtcHelper = require('../actions/rtc/rtcHelper');
var OnConference = require('../actions/rtc/onConference');
var OnRemoteStream = require('../actions/rtc/onRemoteStream');

/**
 * Public API
 * @Author: George_Chen
 * @Description: for handling remote client webrtc stream
 *         
 * @param {Object}          data, signaling data
 */
exports.onRemoteStream = function(data) {
    return SocketUtils.execAction(OnRemoteStream, data, 'onRemoteStream');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for handling remote signaling message
 *         
 * @param {Object}          data, signaling data
 */
exports.onSignaling = function(data) {
    RtcHelper.getConnection(data.channelId).onSignaling(data);
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: handler for "onConference" event
 *         NOTE: rtcWorker sent conference notification periodly
 *         
 * @param {String}          data.channelId, the channel id
 * @param {Array}           data.clients, clients in conference
 */
exports.onConference = function(data) {
    if (!RtcHelper.hasConnection(data.channelId)) {
        return SocketUtils.execAction(OnConference, data, 'onConference');
    }
    var connection = RtcHelper.getConnection(data.channelId);
    return connection
        .removeHangupPeersAsync(data.clients)
        .then(function() {
            var selfSocket = SocketManager.getSocket().id;
            var selfSocketIndex = data.clients.indexOf(selfSocket);
            var offerTargets = [];
            var offerTargetNums = data.clients.length - 1 - selfSocketIndex;
            if (offerTargetNums > 0) {
                offerTargets = data.clients.splice(selfSocketIndex + 1, offerTargetNums);
            }
            return offerTargets;
        }).filter(function(targetId) {
            return !connection.hasPeerConnected(targetId);
        }).then(function(targetIds) {
            if (targetIds.length === 0) {
                return null;
            }
            var packet = _setPacket('getTargetsSdpAsync', null, {
                channelId: data.channelId,
                targets: targetIds
            });
            return _request(packet, 'onConference');
        }).then(function(sdps) {
            if (sdps) return connection.connectAsync(sdps);
        }).catch(function(err) {
            SharedUtils.printError('rtcService.js', 'onConference', err);
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for webrtc to signal with remote target 
 * 
 * @param {String}          data.channelId, the channel id
 * @param {Object}          data.params, current signaling data
 */
exports.signaling = function(data) {
    var channel = SocketUtils.setChannelReq(data.channelId);
    var packet = _setPacket('signaling', 'onSignaling', data);
    var socket = SocketManager.getSocket();
    packet.params.from = socket.id;
    packet.target = packet.params.to;
    return _publish(channel, packet, 'signaling');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: initialize and start the conference on current channel
 *       
 * @param {String}          data.channelId, the channel id
 */
exports.startConferenceAsync = function(data) {
    var packet = _setPacket('startConferenceAsync', null, data);
    return RtcHelper
        .getConnection(data.channelId)
        .getLocalStreamAsync()
        .then(function(stream) {
            if (!stream) {
                throw new Error('get local stream fail');
            }
            return _request(packet, 'startConferenceAsync')
                .then(function(result) {
                    if (!result) {
                        throw new Error('start conference fail on server');
                    }
                    return stream;
                });
        }).catch(function(err) {
            RtcHelper.releaseConnection(data.channelId);
            SharedUtils.printError('rtcService.js', 'startConferenceAsync', err);
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: release and hangup current channel conference
 *       
 * @param {String}          data.channelId, the channel id
 */
exports.hangupConferenceAsync = function(data) {
    var packet = _setPacket('hangupConferenceAsync', null, data);
    return _request(packet, 'hangupConferenceAsync')
        .then(function() {
            return RtcHelper.getConnection(data.channelId).hangupAsync();
        }).then(function() {
            return RtcHelper.releaseConnection(data.channelId);
        });
};

/************************************************
 *
 *           internal functions
 *
 ************************************************/

/**
 * @Author: George_Chen
 * @Description: a sugar sytanx function for handling socekt request
 *              events on rtcService
 *         NOTE: caller is just for print error log; if error happen,
 *              we can know the root cause from which caller
 *       
 * @param {Object}          packet, the packet for request
 * @param {String}          caller, the caller function name
 */
function _request(packet, caller) {
    return SocketManager.requestAsync(packet)
        .catch(function(err) {
            SharedUtils.printError('rtcService.js', caller, err);
            return null;
        });
}

/**
 * @Author: George_Chen
 * @Description: a sugar sytanx function for handling socekt publish
 *              events on rtcService
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
            SharedUtils.printError('rtcService.js', caller, err);
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
    return SocketUtils.setPacket('rtc', serverApi, clientApi, data);
}
