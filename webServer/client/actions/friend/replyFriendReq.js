'use strict';
var Promise = require('bluebird');
var ReqRespService = require('../../services/reqRespService');
var SharedUtils = require('../../../../sharedUtils/utils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: action for reply friend request
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.reqId, the request id
 * @param {String}      data.targetUser, the uid of friend request sender
 * @param {Boolean}     data.isPermitted, the answer of this response
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        reqId: SharedUtils.argsCheckAsync(data.reqId, '_id'),
        respTarget: SharedUtils.argsCheckAsync(data.targetUser, 'md5'),
        isPermitted: SharedUtils.argsCheckAsync(data.isPermitted, 'boolean')
    }).then(function(reqData) {
        return ReqRespService.friendRespAsync(reqData);
    }).then(function(result) {
        if (!result) {
            throw new Error('response friend request fail');
        }
        // TODO: response friend request success
    }).catch(function(err) {
        SharedUtils.printError('replyFriendReq.js', 'core', err);
    });
};
