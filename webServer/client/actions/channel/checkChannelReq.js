'use strict';
var ReqRespService = require('../../services/reqRespService');
var SharedUtils = require('../../../../sharedUtils/utils');
var Promise = require('bluebird');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: action for checking status of channel request (sent or not)
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.targetUser, the uid of channel host
 * @param {String}      data.channelId, the target channel id
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        targetUser: SharedUtils.argsCheckAsync(data.targetUid, 'md5'),
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'string')
    }).then(function(reqData) {
        return ReqRespService.isChannelReqSentAsync(reqData);
    }).then(function(result) {
        if (result === null) {
            throw new Error('check channel request fail on server');
        }
        actionContext.dispatch('ON_INFOCARD_UPDATE', {
            cardId: data.cardId,
            state: {
                isReqSent: result
            }
        });
    }).catch(function(err) {
        SharedUtils.printError('checkChannelReq.js', 'core', err);
    });
};
