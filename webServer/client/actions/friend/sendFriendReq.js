'use strict';
var Promise = require('bluebird');
var ReqRespService = require('../../services/reqRespService');
var SharedUtils = require('../../../../sharedUtils/utils');

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
        return ReqRespService.friendReqAsync(reqData);
    }).then(function(result) {
        if (!result) {
            throw new Error('send friend request fail');
        }
        // TODO:  send friend req success
    }).catch(function(err) {
        SharedUtils.printError('sendFriendReq.js', 'core', err);
    });
};
