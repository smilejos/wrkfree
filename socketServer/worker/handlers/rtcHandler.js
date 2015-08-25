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
    return SharedUtils.argsCheckAsync(data.channelId, 'md5')
        .then(function(cid) {
            var uid = socket.getAuthToken();
            return Promise.join(
                RtcStorage.isSessionExistAsync(cid),
                RtcStorage.isSessionJoinedAsync(cid, uid),
                function(isExist, isJoined) {
                    if (isJoined) {
                        throw new Error('conference has aleready joined');
                    }
                    if (!isExist) {
                        RtcWorker.pushNotification(cid);
                    }
                    return RtcStorage.joinSessionAsync(cid, uid, socket.id, _getDefaultSdp());
                });
        }).then(function(result) {
            var errMsg = 'fail to join rtc session on storage service';
            return SharedUtils.checkExecuteResult(result, errMsg);
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
            var uid = socket.getAuthToken();
            return RtcStorage.leaveSessionAsync(cid, uid, socket.id);
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
 * @param {Array}           data.targets, target client sockets
 */
exports.getTargetsSdpAsync = function(socket, data) {
    return Promise.join(
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        SharedUtils.argsCheckAsync(data.targets, 'array'),
        function(cid, targetSids) {
            var uid = socket.getAuthToken();
            return RtcStorage.keepClientAliveAsync(cid, uid, socket.id)
                .then(function() {
                    var isEmpty = (targetSids.length === 0);
                    return (isEmpty ? null : RtcStorage.getTargetsSdpAsync(cid, targetSids));
                });
        }).catch(function(err) {
            SharedUtils.printError('rtcHandler.js', 'getTargetsSdpAsync', err);
            throw err;
        });
};

/**
 * TODO: we should use redis session based authenticated mechanism
 * Public API
 * @Author: George_Chen
 * @Description: this is for override the client default ice confings
 * 
 */
exports.getIceConfigsAsync = function(socket, data) {
    return Promise.try(function() {
        if (process.env.NODE_ENV !== 'production') {
            return {};
        }
        return {
            iceServers: [{
                url: "stun:stun.l.google.com:19302"
            }, {
                url: "turn:turn.wrkfree.com:3478",
                username: "wrkfree",
                credential: "user@wrkfree"
            }]
        };
    }).catch(function(err) {
        SharedUtils.printError('rtcHandler.js', 'getIceConfigsAsync', err);
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
