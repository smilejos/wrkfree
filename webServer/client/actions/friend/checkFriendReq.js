'use strict';
var ReqRespService = require('../../services/reqRespService');
var SharedUtils = require('../../../../sharedUtils/utils');
var Promise = require('bluebird');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: action for checking status of friend request (sent or not)
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.targetUid, the uid of target user
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        targetUser: SharedUtils.argsCheckAsync(data.targetUid, 'md5')
    }).then(function(reqData) {
        return ReqRespService.isFriendReqSentAsync(reqData);
    }).then(function(result) {
        if (result === null) {
            throw new Error('check friend request fail on server');
        }
        actionContext.dispatch('ON_INFOCARD_UPDATE', {
            cardId: data.cardId,
            state: {
                isReqSent: result
            }
        });
    }).catch(function(err) {
        SharedUtils.printError('checkFriendReq.js', 'core', err);
    });
};
