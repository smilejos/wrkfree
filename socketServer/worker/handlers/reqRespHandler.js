'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');
var StorageManager = require('../../../storageService/storageManager');
var ChannelStorage = StorageManager.getService('Channel');
var FriendStorage = StorageManager.getService('Friend');
var ReqRespStorage = StorageManager.getService('ReqResp');

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to send channel request
 *
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.targetUser, the uid of target user
 * @param {String}          data.channelId, the channel id
 */
exports.channelReqAsync = function(socket, data) {
    return Promise.join(
        SharedUtils.argsCheckAsync(data.targetUser, 'md5'),
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        function(target, cid) {
            var uid = socket.getAuthToken();
            var type = 'channel';
            return ReqRespStorage.saveReqAsync(uid, target, type, cid);
        }).then(function(result) {
            if (result === null) {
                throw new Error('save request fail');
            }
            return _getExtraChannelInfo(data.channelId).then(function(info) {
                var notification = _setReqNotification(result, info);
                _notifyTarget(socket, data.targetUser, notification);
                return notification;
            });
        }).catch(function(err) {
            SharedUtils.printError('reqRespHandler.js', 'channelReqAsync', err);
            throw new Error('send channel request fail');
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to send friend request
 *
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.targetUser, the uid of target user
 */
exports.friendReqAsync = function(socket, data) {
    return SharedUtils.argsCheckAsync(data.targetUser, 'md5')
        .then(function(target) {
            var uid = socket.getAuthToken();
            var type = 'friend';
            return ReqRespStorage.saveReqAsync(uid, target, type);
        }).then(function(result) {
            if (result === null) {
                throw new Error('save request fail');
            }
            var notification = _setReqNotification(result, {});
            _notifyTarget(socket, data.targetUser, notification);
            return notification;
        }).catch(function(err) {
            SharedUtils.printError('reqRespHandler.js', 'friendReqAsync', err);
            throw new Error('send friend request fail');
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for channel host to response the specific request
 *
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.reqId, the request id
 * @param {String}          data.respTarget, the uid of response target
 * @param {Boolean}         data.isPermitted, the answer from host
 * @param {String}          data.channelId, the channel id
 */
exports.channelRespAsync = function(socket, data) {
    return Promise.join(
        SharedUtils.argsCheckAsync(data.reqId, '_id'),
        SharedUtils.argsCheckAsync(data.respTarget, 'md5'),
        SharedUtils.argsCheckAsync(data.isPermitted, 'boolean'),
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        function(reqId, target, isPermitted, cid) {
            var uid = socket.getAuthToken();
            var type = 'channel';
            return _handleResp(socket, reqId, uid, target, isPermitted, type, cid)
                .then(function(result) {
                    if (result === null) {
                        throw new Error('handle channel response error');
                    }
                    return _getExtraChannelInfo(cid).then(function(info) {
                        var notification = _setRespNotification(reqId, uid, target, isPermitted, type, info);
                        _notifyTarget(socket, target, notification);
                        return result;
                    });
                });
        }).catch(function(err) {
            SharedUtils.printError('reqRespHandler.js', 'channelRespAsync', err);
            throw new Error('response channel request fail');
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to response the friend request
 *
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.reqId, the request id
 * @param {String}          data.respTarget, the uid of response target
 * @param {Boolean}         data.isPermitted, the answer from host
 */
exports.friendRespAsync = function(socket, data) {
    return Promise.join(
        SharedUtils.argsCheckAsync(data.reqId, '_id'),
        SharedUtils.argsCheckAsync(data.respTarget, 'md5'),
        SharedUtils.argsCheckAsync(data.isPermitted, 'boolean'),
        function(reqId, target, isPermitted) {
            var uid = socket.getAuthToken();
            var type = 'friend';
            return _handleResp(socket, reqId, uid, target, isPermitted, type)
                .then(function(result) {
                    if (result === null) {
                        throw new Error('handle friend response error');
                    }
                    var notification = _setRespNotification(reqId, uid, target, isPermitted, type, {});
                    _notifyTarget(socket, target, notification);
                    return result;
                });
        }).catch(function(err) {
            SharedUtils.printError('reqRespHandler.js', 'friendRespAsync', err);
            throw new Error('response friend request fail');
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to check specific channel request has been sent or not
 *
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.targetUser, the uid of target user
 * @param {String}          data.channelId, the channel id
 */
exports.isChannelReqSentAsync = function(socket, data) {
    return Promise.join(
        SharedUtils.argsCheckAsync(data.targetUser, 'md5'),
        SharedUtils.argsCheckAsync(data.channelId, 'string'),
        function(target, cid) {
            var type = 'channel';
            var uid = socket.getAuthToken();
            return ReqRespStorage.isReqSentAsync(uid, target, type, cid);
        }).catch(function(err) {
            SharedUtils.printError('reqRespHandler.js', 'isChannelReqSentAsync', err);
            throw new Error('check channel request status error');
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to check specific friend request has been sent or not
 *
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.targetUser, the uid of target user
 */
exports.isFriendReqSentAsync = function(socket, data) {
    return SharedUtils.argsCheckAsync(data.targetUser, 'md5')
        .then(function(target) {
            var type = 'friend';
            var uid = socket.getAuthToken();
            return ReqRespStorage.isReqSentAsync(uid, target, type);
        }).catch(function(err) {
            SharedUtils.printError('reqRespHandler.js', 'isFriendReqSentAsync', err);
            throw new Error('check friend request status error');
        });
};

/**
 * @Author: George_Chen
 * @Description: for handling response by type
 *
 * @param {String}          reqId, the request id
 * @param {String}          uid, the uid of replier
 * @param {String}          target, the uid of response target
 * @param {Boolean}         isPermitted, the answer from host
 * @param {String}          type, the original request type
 * @param {String}          extraInfo, extra information of request
 */
function _handleResp(socket, reqId, uid, target, isPermitted, type, extraInfo) {
    return ReqRespStorage.isReplierAuthAsync(reqId, uid)
        .then(function(isAuth) {
            if (!isAuth) {
                throw new Error('not auth to response');
            }
            if (type === 'channel' && isPermitted) {
                return ChannelStorage.addNewMemberAsync(uid, target, extraInfo);
            }
            if (type === 'friend' && isPermitted) {
                return FriendStorage.addFriendshipAsync(uid, target);
            }
            return true;
        }).then(function(result) {
            if (!result) {
                throw new Error('handle response operation fail');
            }
            return ReqRespStorage.saveRespAsync(reqId, uid, target, isPermitted);
        });
}

/**
 * @Author: George_Chen
 * @Description: to push new notification data to target
 *
 * @param {Object}          socket, the client socket instance
 * @param {String}          target, the uid of target
 * @param {Object}          data, the notification data
 */
function _notifyTarget(socket, target, data) {
    var targetChannel = 'user:' + target;
    data.isNotification = false;
    data.updatedTime = Date.now();
    socket.global.publish(targetChannel, {
        service: 'user',
        clientHandler: 'onNotification',
        params: data
    });
}

/**
 * @Author: George_Chen
 * @Description: for channel request/response, get the extra channel info
 *
 * @param {String}          cid, the channel id 
 */
function _getExtraChannelInfo(cid) {
    return ChannelStorage.getChannelInfoAsync(cid)
        .then(function(channel) {
            return {
                channelId: channel.basicInfo.channelId,
                name: channel.basicInfo.name
            };
        });
}

/**
 * @Author: George_Chen
 * @Description: to create the new request notification data
 *
 * @param {Object}          saveResult, request save result (mongodb doc)
 * @param {Object}          extraInfo, the extra info of this request
 */
function _setReqNotification(saveResult, extraInfo) {
    saveResult.reqId = saveResult._id;
    delete saveResult._id;
    saveResult.extraInfo = extraInfo;
    return saveResult;
}

/**
 * @Author: George_Chen
 * @Description: to create the new response notification data
 *
 * @param {String}          id, the request id
 * @param {String}          uid, the sender uid
 * @param {String}          targetUid, the uid of response target
 * @param {Boolean}         isPermitted, the answer from host
 * @param {String}          respType, the type of this response (channel or friend)
 * @param {Object}          extraData, the extra infomation of the response notification
 */
function _setRespNotification(id, uid, targetUid, isPermitted, respType, extraData) {
    return {
        reqId: id,
        sender: uid,
        target: targetUid,
        type: respType,
        isReq: false,
        isReaded: false,
        respToPermitted: isPermitted,
        extraInfo: extraData
    };
}

// TODO:

// exports.readAllAsync = function() {

// };

// exports.readReqRespAsync = function() {

// };
