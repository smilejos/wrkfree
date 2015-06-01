'use strict';
var SessionTemp = require('../tempStores/RtcSessionTemp');
var SharedUtils = require('../../sharedUtils/utils');
var Promise = require('bluebird');

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
    return SessionTemp.getAsync(channelId)
        .then(function(session) {
            if (!session || session.clients.indexOf(socketId) === -1) {
                throw new Error('set client sdp fail');
            }
            session.sdps[socketId] = sdp;
            return SessionTemp.setAsync(channelId, session);
        }).catch(function(err) {
            SharedUtils.printError('RtcService.js', 'setSdpAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: add rtc client and related sdp to rtc temp store
 *         NOTE: sdp is based on each socket client
 *
 * @param {String}      channelId, channel id
 * @param {String}      socketId, the client socket id
 * @param {Object}      sdp, session's sdp
 */
exports.addClientAsync = function(channelId, socketId, sdp) {
    return SessionTemp.getAsync(channelId)
        .then(function(session) {
            if (!session) {
                session = {
                    clients: [socketId],
                    sdps: {}
                };
            } else {
                if (session.clients.indexOf(socketId) > 0) {
                    return true;
                }
                session.clients.push(socketId);
            }
            session.sdps[socketId] = sdp;
            return SessionTemp.setAsync(channelId, session);
        }).catch(function(err) {
            SharedUtils.printError('RtcService.js', 'addClientAsync', err);
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
exports.delClientAsync = function(channelId, socketId) {
    return SessionTemp.getAsync(channelId)
        .then(function(session) {
            if (!session) {
                throw new Error('rtc session is not exist');
            }
            var socketIndex = session.clients.indexOf(socketId);
            if (socketIndex > 0) {
                session.clients.splice(socketIndex, 1);
            }
            if (session.sdps[socketId]) {
                delete session.sdps[socketId];
            }
            return SessionTemp.setAsync(channelId, session);
        }).catch(function(err) {
            SharedUtils.printError('RtcService.js', 'delClientAsync', err);
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
    var ttlSession = (isKeepAlive ? SessionTemp.ttlAsync : function(){});
    return Promise.join(
        SessionTemp.getAsync(channelId), 
        ttlSession(channelId),
        function(session) {
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
