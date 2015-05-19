'use strict';
var Promise = require('bluebird');
var ReqRespService = require('../../services/reqRespService');
var SharedUtils = require('../../../../sharedUtils/utils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: action for sending channel request
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.targetUser, the uid of channel host
 * @param {String}      data.channelId, the target channel id
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        targetUser: SharedUtils.argsCheckAsync(data.targetUser, 'md5'),
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
    }).then(function(reqData) {
        return ReqRespService.channelReqAsync(reqData);
    }).then(function(result) {
        if (!result) {
            throw new Error('send channel request fail');
        }
        // TODO:  send channel req success
    }).catch(function(err) {
        SharedUtils.printError('sendChannelReq.js', 'core', err);
    });
};
