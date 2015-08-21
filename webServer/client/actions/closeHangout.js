'use strict';
var SharedUtils = require('../../../sharedUtils/utils');
var ChannelService = require('../services/channelService');
var HangupConference = require('./rtc/hangupConference');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: for user to close target hangout window
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, the channel id
 * @param {Boolean}     data.isStayed, to indicate stay in channel or not
 */
module.exports = function(actionContext, data) {
    return Promise.join(
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        SharedUtils.argsCheckAsync(data.isStayed, 'boolean'),
        function(cid, isStayed) {
            return (isStayed ? true : ChannelService.leaveAsync(cid));
        }).then(function(result) {
            if (!result) {
                throw new Error('leave hangout fail');
            }
            var reqData = {
                channelId: data.channelId
            };
            if (!data.isStayed) {
                actionContext.executeAction(HangupConference, reqData);
            }
            actionContext.dispatch('CLOSE_OPEN_HANGOUT', reqData);
        }).catch(function(err) {
            SharedUtils.printError('openHangout.js', 'core', err);
        });
};
