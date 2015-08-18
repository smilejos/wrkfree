'use strict';
var Promise = require('bluebird');
var SessionTemp = require('../tempStores/RtcSessionTemp');
var ClientTemp = require('../tempStores/RtcClientTemp');
var SharedUtils = require('../../sharedUtils/utils');
var ChannelDao = require('../daos/ChannelDao');

/**
 * Public API
 * @Author: George_Chen
 * @Description: add rtc client and related sdp to rtc temp store
 *
 * @param {String}      channelId, channel id
 * @param {String}      socketId, the client socket id
 * @param {Object}      sdp, session's sdp
 */
exports.joinSessionAsync = function(channelId, socketId, sdp) {
    return Promise.join(
        SessionTemp.joinAsync(channelId, socketId),
        ClientTemp.setSdpAsync(channelId, socketId, sdp),
        function(joinResult, setResult) {
            return (joinResult || setResult);
        }).catch(function(err) {
            SharedUtils.printError('RtcService.js', 'joinSessionAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: modify the current client's sdp
 *         NOTE: sdp is based on each socket client
 *
 * @param {String}      channelId, channel id
 * @param {String}      socketId, the client socket id
 * @param {Object}      sdp, session's sdp
 */
exports.setSdpAsync = function(channelId, socketId, sdp) {
    return ClientTemp.setSdpAsync(channelId, socketId, sdp)
        .catch(function(err) {
            SharedUtils.printError('RtcService.js', 'setSdpAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: remove rtc client from rtc temp store
 *
 * @param {String}      channelId, channel id
 * @param {String}      socketId, the client socket id
 */
exports.leaveSessionAsync = function(channelId, socketId) {
    return ChannelDao.is1on1Async(channelId)
        .then(function(is1on1) {
            if (is1on1) {
                return SessionTemp.deleteAsync(channelId);
            }
            return SessionTemp.leaveAsync(channelId, socketId);
        }).catch(function(err) {
            SharedUtils.printError('RtcService.js', 'leaveSessionAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to get current rtc session members
 *
 * @param {String}      channelId, channel id
 */
exports.getSessionMembersAsync = function(channelId) {
    return SessionTemp.getAsync(channelId)
        .then(function(members) {
            console.log('[DEBUG] ========getSessionMembersAsync======> ', channelId);
            if (members.length === 0) {
                return members;
            }
            return ClientTemp.getAliveCountsAsync(channelId, members)
                .then(function(counts) {
                    return (counts > 1 ? SessionTemp.keepAliveAsync(channelId) : true);
                }).then(function() {
                    return members;
                });
        }).catch(function(err) {
            SharedUtils.printError('RtcService.js', 'getSessionMembersAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to get session sdps based on target clients
 *
 * @param {String}      channelId, channel id
 * @param {Array}       targets, an array of target clientIds
 */
exports.getTargetsSdpAsync = function(channelId, targets) {
    return ClientTemp.getSdpsAsync(channelId, targets)
        .then(function(targetSdps) {
            var sdps = {};
            SharedUtils.fastArrayMap(targets, function(clientId, index) {
                sdps[clientId] = targetSdps[index];
            });
            return sdps;
        }).catch(function(err) {
            SharedUtils.printError('RtcService.js', 'getTargetsSdpAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to keep the rtc client alive
 *
 * @param {String}      channelId, channel id
 * @param {String}      socketId, the client socket id
 */
exports.keepClientAliveAsync = function(channelId, socketId) {
    return ClientTemp.keepAliveAsync(channelId, socketId)
        .catch(function(err) {
            SharedUtils.printError('RtcService.js', 'keepClientAliveAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to check current rtc session is exist or not
 *
 * @param {String}      channelId, channel id
 */
exports.isSessionExistAsync = function(channelId) {
    return SessionTemp.isExistAsync(channelId)
        .catch(function(err) {
            SharedUtils.printError('RtcService.js', 'isSessionExistAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: remove rtc session on current channel
 *
 * @param {String}      channelId, channel id
 */
exports.releaseSessionAsync = function(channelId) {
    return SessionTemp.deleteAsync(channelId)
        .catch(function(err) {
            SharedUtils.printError('RtcService.js', 'releaseSessionAsync', err);
            return null;
        });
};
