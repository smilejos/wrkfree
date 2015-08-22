'use strict';
var SharedUtils = require('../../../sharedUtils/utils');
var SocketManager = require('./socketManager');
var SocketUtils = require('./socketUtils');
var RtcHelper = require('../actions/rtc/rtcHelper');
var OnConference = require('../actions/rtc/onConference');
var OnConferenceStop = require('../actions/rtc/onConferenceStop');
var OnRemoteStream = require('../actions/rtc/onRemoteStream');
var OnConnectivityFail = require('../actions/rtc/onConnectivityFail');
var NotifyConferenceCall = require('../actions/rtc/notifyConferenceCall');
var Promise = require('bluebird');

var SessionsTimeout = {};
var NotificationsTimeout = {};

var Configs = require('../../../configs/config');
var RTC_CANCEL_TIMEOUT_IN_MSECOND = Configs.get().params.rtc.sessionCancelInMScend;
if (!SharedUtils.isNumber(RTC_CANCEL_TIMEOUT_IN_MSECOND)) {
    throw new Error('get rtc parameters error');
}

/**
 * the runtime iceserver settings
 */
var RuntimeIceServers = null;

/**
 * Public API
 * @Author: George_Chen
 * @Description: for handling remote client webrtc stream
 *         
 * @param {String}          data.channelId, current channel id
 * @param {String}          data.clientId, the remote client sid
 * @param {Object}          data.stream, the remote rtc stream
 */
exports.onRemoteStream = function(data) {
    return SocketUtils.execAction(OnRemoteStream, data, 'onRemoteStream');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: used to notify user that his/her rtc call got fail
 *
 * @param {String}          data.channelId, the channel id of current connection
 * @param {String}          data.message, fail message
 * @param {Boolean}         data.isLocal, to indicate sender is local or remote
 */
exports.onConnectivityFail = function(data) {
    return SocketUtils.execAction(OnConnectivityFail, data, 'onConnectivityFail');
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
 * @Description: handler for "notifyConferenceCall" event
 *         
 * @param {String}          data.channelId, the channel id
 */
exports.notifyConferenceCall = function(data) {
    var subscribeChannel = 'channel:' + data.channelId;
    if (!SocketManager.hasSubscription(subscribeChannel)) {
        if (data.clients.length > 0) {
            _trackRtcNotification(data);
        }
        SocketUtils.execAction(NotifyConferenceCall, {
            channelId: data.channelId,
            hasCall: (data.clients.length > 0)
        });
    }
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
    console.log('[DEBUG] current conference session ', data.clients);
    if (data.clients.length === 0) {
        return _conferenceStop(data);
    }
    _trackConference({
        channelId: data.channelId
    });
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
 * @Description: initialize rtc service
 *         NOTE: currently just pre-init device media support check
 */
exports.initRtcAsync = function() {
    var packet = _setPacket('getIceConfigsAsync', null, {});
    return _request(packet, 'getIceConfigsAsync')
        .then(function(data) {
            if (SharedUtils.isArray(data.iceServers)) {
                RuntimeIceServers = data.iceServers;
            }
            if (require('webrtcsupport').getUserMedia) {
                return RtcHelper.getDeviceSupportAsync();
            }
        }).catch(function(err) {
            SharedUtils.printError('rtcService.js', 'initRtcAsync', err);
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: initialize and start the conference on current channel
 *       
 * @param {String}          data.channelId, the channel id
 */
exports.startConferenceAsync = function(data) {
    return RtcHelper.getDeviceSupportAsync()
        .then(function(media) {
            var options = {};
            if (RuntimeIceServers) {
                options.peerConnectionConfig = {
                    iceServers: RuntimeIceServers
                };
            }
            return RtcHelper.getConnection(data.channelId, options)
                .getMediaStreamAsync(media)
                .then(function(stream) {
                    if (!stream) {
                        throw new Error('get local stream fail');
                    }
                    var packet = _setPacket('startConferenceAsync', null, data);
                    return _request(packet, 'startConferenceAsync')
                        .then(function(result) {
                            if (!result) {
                                throw new Error('start conference fail on server');
                            }
                            return RtcHelper.getVisibleStreamAsync(media);
                        });
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

/**
 * Public API
 * @Author: George_Chen
 * @Description: to control rtc media on current channel
 *       
 * @param {String}           data.channelId, the channel id
 * @param {Boolean}          data.isVideo, indicate target media is video or audio
 * @param {Boolean}          data.isOn, indicate mode is on or not
 */
exports.controlMediaAsync = function(data) {
    return Promise.try(function() {
        if (!RtcHelper.hasConnection(data.channelId)) {
            throw new Error('connection is not initialized');
        }
        return RtcHelper
            .getConnection(data.channelId)
            .controlMedia(data.isVideo, data.isOn);
    });
};

/************************************************
 *
 *           internal functions
 *
 ************************************************/

function _conferenceStop(data) {
    return exports.hangupConferenceAsync(data)
        .then(function() {
            return SocketUtils.execAction(OnConferenceStop, data);
        }).catch(function(err) {
            SharedUtils.printError('rtcService.js', '_conferenceStop', err);
        });
}

/**
 * @Author: George_Chen
 * @Description: used to track conference session state
 *         NOTE: if not received specific conference call event from server, 
 *               we should release the specific conference session
 *         
 * @param {String}          data.channelId, the channel id
 */
function _trackConference(data) {
    if (SessionsTimeout[data.channelId]) {
        clearTimeout(SessionsTimeout[data.channelId]);
    }
    SessionsTimeout[data.channelId] = setTimeout(function() {
        console.log('[DEBUG] conference session timeout .......');
        _conferenceStop(data);
    }, RTC_CANCEL_TIMEOUT_IN_MSECOND);
}

/**
 * @Author: George_Chen
 * @Description: used to track conference notification state
 *         NOTE: only subscribed channels will get conference notifications
 *         
 * @param {String}          data.channelId, the channel id
 */
function _trackRtcNotification(data) {
    if (NotificationsTimeout[data.channelId]) {
        clearTimeout(NotificationsTimeout[data.channelId]);
    }
    NotificationsTimeout[data.channelId] = setTimeout(function() {
        SocketUtils.execAction(NotifyConferenceCall, {
            channelId: data.channelId,
            hasCall: false
        });
    }, RTC_CANCEL_TIMEOUT_IN_MSECOND);
}

/**
 * @Author: George_Chen
 * @Description: a sugar sytanx function for handling socket request
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
 * @Description: a sugar sytanx function for wrap the socket formatted
 *               packet
 *
 * @param {String}          serverApi, the server handler api
 * @param {String}          clientApi, the client receiver api
 * @param {Object}          data, the request parameters
 */
function _setPacket(serverApi, clientApi, data) {
    return SocketUtils.setPacket('rtc', serverApi, clientApi, data);
}
