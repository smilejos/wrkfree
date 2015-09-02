'use strict';
var Promise = require('bluebird');
var ReqRespService = require('../../services/reqRespService');
var SharedUtils = require('../../../../sharedUtils/utils');
var ActionUtils = require('../actionUtils');

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
        actionContext.dispatch('ON_INFOCARD_UPDATE', {
            cardId: reqData.channelId,
            state: {
                isReqSent: true
            }
        });
        return ReqRespService.channelReqAsync(reqData);
    }).then(function(result) {
        if (result === null) {
            actionContext.dispatch('ON_INFOCARD_UPDATE', {
                cardId: data.channelId,
                state: {
                    isReqSent: false
                }
            });
            throw new Error('send channel request fail');
        }
        ActionUtils.showSuccessEvent('Success', 'sent channel request done');
    }).catch(function(err) {
        SharedUtils.printError('sendChannelReq.js', 'core', err);
        ActionUtils.showWarningEvent('WARN', 'send channel request fail');
    });
};
