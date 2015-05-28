'use strict';
var SessionTemp = require('../tempStores/RtcSessionTemp');
var SharedUtils = require('../../sharedUtils/utils');
var Promise = require('bluebird');

/**
 * Public API
 * @Author: George_Chen
 * @Description: set the client sdp on rtc session
 *         NOTE: sdp is based on each socket client
 *
 * @param {String}      channelId, channel id
 * @param {String}      socketId, the client socket id
 * @param {Object}      sdp, session's sdp
 */
exports.setSdpAsync = function(channelId, socketId, sdp) {
    return SessionTemp.getAsync(channelId)
        .then(function(session) {
            if (!session) {
                session = {};
            }
            session[socketId] = sdp;
            return SessionTemp.setAsync(channelId, session);
        }).catch(function(err) {
            SharedUtils.printError('RtcService.js', 'setSdpAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: remove the client sdp from rtc session
 *
 * @param {String}      channelId, channel id
 * @param {String}      socketId, the client socket id
 */
exports.removeSdpAsync = function(channelId, socketId) {
    return SessionTemp.getAsync(channelId)
        .then(function(session) {
            if (!session) {
                throw new Error('rtc session is not exist');
            }
            delete session[socketId];
            return SessionTemp.setAsync(channelId, session);
        }).catch(function(err) {
            SharedUtils.printError('RtcService.js', 'removeSdpAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: get rtc session descriptions from channel
 *         NOTE: use "isKeepAlive" to extend the session ttl
 *
 * @param {String}      channelId, channel id
 * @param {Boolean}     isKeepAlive, indicate keep session alive or not
 */
exports.getSessionAsync = function(channelId, isKeepAlive) {
    return Promise.join(
        SessionTemp.getAsync(channelId), (isKeepAlive ? SessionTemp.ttlAsync(channelId) : null),
        function(session) {
            if (!session) {
                throw new Error('rtc session is not exist');
            }
            return session;
        }).catch(function(err) {
            SharedUtils.printError('RtcService.js', 'getSessionAsync', err);
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
