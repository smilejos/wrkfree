'use strict';
var Promise = require('bluebird');
var ReqRespService = require('../../services/reqRespService');
var SharedUtils = require('../../../../sharedUtils/utils');
var ActionUtils = require('../actionUtils');


/**
 * @Public API
 * @Author: George_Chen
 * @Description: action for sending friend request
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.targetUser, the uid of target user

 */
module.exports = function(actionContext, data) {
    return Promise.props({
        targetUser: SharedUtils.argsCheckAsync(data.targetUser, 'md5')
    }).then(function(reqData) {
        actionContext.dispatch('ON_INFOCARD_UPDATE', {
            cardId: reqData.targetUser,
            state: {
                isReqSent: true
            }
        });
        return ReqRespService.friendReqAsync(reqData);
    }).then(function(result) {
        if (result === null) {
            actionContext.dispatch('ON_INFOCARD_UPDATE', {
                cardId: data.targetUser,
                state: {
                    isReqSent: false
                }
            });
            throw new Error('send friend request fail');
        }
        ActionUtils.showSuccessEvent('Success', 'sent friend request done');
    }).catch(function(err) {
        SharedUtils.printError('sendFriendReq.js', 'core', err);
        ActionUtils.showWarningEvent('WARN', 'send friend request fail');
    });
};
