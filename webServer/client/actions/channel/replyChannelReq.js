'use strict';
var Promise = require('bluebird');
var ReqRespService = require('../../services/reqRespService');
var SharedUtils = require('../../../../sharedUtils/utils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: action for channel host to reply channel request
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.id, the notification id
 * @param {String}      data.target, the uid of friend request sender
 * @param {String}      data.channelId, the target channel id
 * @param {Boolean}     data.permit, the answer of this response
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        reqId: SharedUtils.argsCheckAsync(data.id, '_id'),
        respTarget: SharedUtils.argsCheckAsync(data.target, 'md5'),
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        isPermitted: SharedUtils.argsCheckAsync(data.permit, 'boolean')
    }).then(function(reqData) {
        return ReqRespService.channelRespAsync(reqData);
    }).then(function(result) {
        if (!result) {
            throw new Error('response channel request fail');
        }
        actionContext.dispatch('DELETE_NOTIFICATION', {
            reqId: data.id,
            isReq: true
        });
    }).catch(function(err) {
        SharedUtils.printError('replyChannelReq.js', 'core', err);
    });
};
