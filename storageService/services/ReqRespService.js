'use strict';
var SharedUtils = require('../../sharedUtils/utils');
var Promise = require('bluebird');
var ReqRespDao = require('../daos/ReqRespDao');
var FriendDao = require('../daos/FriendDao');
var MemberDao = require('../daos/ChannelMemberDao');

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
        .catch(function(err) {
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
            return FriendDao.isFriendExistAsync(target, sender);
        }
        throw new Error('unsupported request type');
    });
}
