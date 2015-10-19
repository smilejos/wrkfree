'use strict';
var SharedUtils = require('../../sharedUtils/utils');
var Promise = require('bluebird');
var ReqRespDao = require('../daos/ReqRespDao');
var MemberDao = require('../daos/ChannelMemberDao');
var UserDao = require('../daos/UserDao');
var PgFriend = require('../pgDaos/PgFriend');
var PgChannel = require('../pgDaos/PgChannel');

/************************************************
 *
 *           Public APIs
 *
 ************************************************/

/**
 * Public API
 * @Author: George_Chen
 * @Description: to create a rquest document
 *
 * @param {String}          sender, the uid of req sender
 * @param {String}          target, the uid of target user
 * @param {String}          type, request type
 * @param {String}          info, extra information
 */
exports.saveReqAsync = function(sender, target, type, info) {
    return Promise.join(
        ReqRespDao.isReqSentAsync(sender, target, type, info),
        _isReqCompleted(sender, target, type, info),
        function(isSent, isCompleted) {
            if (isSent || isCompleted) {
                throw new Error('request has already sent or completed');
            }
            return ReqRespDao.saveReqAsync(sender, target, type, info);
        }).then(function(reqResult) {
            if (!reqResult) {
                throw new Error('save request fail');
            }
            return _incrNoticeCounts(target, 'saveReqAsync').then(function() {
                return reqResult;
            });
        }).catch(function(err) {
            SharedUtils.printError('ReqRespService.js', 'saveReqAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: used for user to reply any request sent to him or her
 *         
 * @param {String}          reqId, the _id of reqresp document
 * @param {String}          replier, the uid of request replier
 * @param {String}          originalSender, the uid of request sender
 * @param {Boolean}         isPermitted, indicate the answer is permitter or not
 */
exports.saveRespAsync = function(reqId, replier, originalSender, isPermitted) {
    return ReqRespDao.updateToRespAsync(reqId, replier, originalSender, isPermitted)
        .then(function(respResult) {
            if (!respResult) {
                throw new Error('save response fail');
            }
            return _incrNoticeCounts(originalSender, 'saveRespAsync').then(function() {
                return respResult;
            });
        }).catch(function(err) {
            SharedUtils.printError('ReqRespService.js', 'saveRespAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: before user update the response, call this API to check the auth
 *
 * @param {String}          reqId, the request id
 * @param {String}          replier, the replier uid
 */
exports.isReplierAuthAsync = function(reqId, replier) {
    return ReqRespDao.isReplierAuthAsync(reqId, replier)
        .catch(function(err) {
            SharedUtils.printError('ReqRespService.js', 'isReplierAuthAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to check certain request has been sent or not
 *
 * @param {String}          sender, the uid of req sender
 * @param {String}          target, the uid of target user
 * @param {String}          type, request type
 * @param {String}          info, extra information
 */
exports.isReqSentAsync = function(reqSender, targetUser, reqType, info) {
    return ReqRespDao.isReqSentAsync(reqSender, targetUser, reqType, info)
        .catch(function(err) {
            SharedUtils.printError('ReqRespService.js', 'isReqSentAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to find specific friend request infomation
 *
 * @param {String}          reqSender, the uid of req uesr
 * @param {String}          targetUser, the uid of target user
 */
exports.getFriendReqInfoAsync = function(reqSender, targetUser) {
    return ReqRespDao.findFriendReqAsync(reqSender, targetUser)
        .catch(function(err){
            SharedUtils.printError('ReqRespService.js', 'getFriendReqInfoAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: get user readed or unreaded requests and responses
 *
 * @param {Object}          socket, the client socket instance
 * @param {Boolean}         isReaded, to indicate readed or not (optional)
 */
exports.getReqRespAsync = function(sender, isReaded) {
    return ReqRespDao.findByTargetAsync(sender, isReaded)
        .map(function(reqRespItem) {
            reqRespItem.isNotification = false;
            if (reqRespItem.type !== 'channel') {
                return reqRespItem;
            }
            return PgChannel.findByIdAsync(reqRespItem.extraInfo)
                .then(function(info) {
                    reqRespItem.extraInfo = {
                        channelId: info.channelId,
                        name: info.name
                    };
                    return reqRespItem;
                });
        }).catch(function(err) {
            SharedUtils.printError('ReqRespService.js', 'getReqRespAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to mark specific reqResp notification as readed
 *
 * @param {String}          reqId, the reqResp id
 * @param {String}          sender, the uid of req sender
 */
exports.readReqRespAsync = function(reqId, sender) {
    return ReqRespDao.updateToReadedAsync(reqId, sender)
        .catch(function(err) {
            SharedUtils.printError('ReqRespService.js', 'readReqRespAsync', err);
            return null;
        });
};

/**
 * @Author: George_Chen
 * @Description: used to check that request realted operation has been executed or not
 *
 * @param {String}          sender, the uid of req sender
 * @param {String}          target, the uid of target user
 * @param {String}          type, request type
 * @param {String}          info, extra information
 */
function _isReqCompleted(sender, target, type, info) {
    return Promise.try(function() {
        if (type === 'channel') {
            return MemberDao.isExistAsync(sender, info);
        }
        if (type === 'friend') {
            return PgFriend.hasFriendAsync(sender, target);
        }
        throw new Error('unsupported request type');
    });
}

/**
 * @Author: George_Chen
 * @Description: to increment current user's unread notice counts
 *
 * @param {String}          user, user's id
 * @param {String}          caller, the caller of this API
 */
function _incrNoticeCounts(user, caller) {
    var err = new Error('incrNoticeCounts fail');
    return UserDao.setUnreadNoticeCountAsync(user, false)
        .then(function(incrResult) {
            if (!incrResult) {
                SharedUtils.printError('ReqRespService.js', caller, err);
            }
        });
}
