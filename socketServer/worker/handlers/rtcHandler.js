'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');
var StorageManager = require('../../../storageService/storageManager');
var RtcStorage = StorageManager.getService('Rtc');
var RtcWorker = require('../services/rtcWorker');

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to start his conference state on current channel
 *       
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, the channel id
 */
exports.startConferenceAsync = function(socket, data) {
    return Promise.join(
        RtcStorage.getSessionAsync(data.channelId),
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        function(session, cid) {
            var sdp = _getDefaultSdp();
            return RtcStorage.addClientAsync(cid, socket.id, sdp)
                .then(function() {
                    return (!session ? RtcWorker.pushNotification(cid) : true);
                });
        }).catch(function(err) {
            SharedUtils.printError('rtcHandler.js', 'startConferenceAsync', err);
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to hangup channel conference
 *       
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, the channel id
 */
exports.hangupConferenceAsync = function(socket, data) {
    return SharedUtils.argsCheckAsync(data.channelId, 'md5')
        .then(function(cid) {
            return RtcStorage.delClientAsync(cid, socket.id);
        }).then(function(success) {
            var errMsg = 'fail to delete rtc client on storage service';
            return SharedUtils.checkExecuteResult(success, errMsg);
        }).catch(function(err) {
            SharedUtils.printError('rtcHandler.js', 'hangupConferenceAsync', err);
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to get session description of target users
 *         NOTE: caller need to get the callee's sdp for signaling
 *       
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.channelId, the channel id
 * @param {Array}          data.targets, target client sockets
 */
exports.getTargetsSdpAsync = function(socket, data) {
    return Promise.join(
        RtcStorage.getSessionAsync(data.channelId),
        SharedUtils.argsCheckAsync(data.targets, 'array'),
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        function(session, targets) {
            if (!session) {
                throw new Error('fail to get current rtc session on storage service');
            }
            var sdps = {};
            SharedUtils.fastArrayMap(targets, function(client) {
                sdps[client] = session.sdps[client];
            });
            return sdps;
        }).catch(function(err) {
            SharedUtils.printError('rtcHandler.js', 'getTargetsSdp', err);
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: used for conference signaling
 *         NOTE: currently do nothing on this API
 */
exports.signaling = function() {
    // currently do nothing
};

/**
 * @Author: George_Chen
 * @Description: get the default sdp of socket client
 */
function _getDefaultSdp() {
    return {
        video: true,
        audio: false,
        screen: false
    };
}
