'use strict';
var SharedUtils = require('../../../sharedUtils/utils');
var ChannelService = require('../services/channelService');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: for user to close target hangout window
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, the channel id
 */
module.exports = function(actionContext, data) {
    return SharedUtils.argsCheckAsync(data.channelId, 'md5')
        .then(function(cid) {
            return ChannelService.leaveAsync(cid)
                .then(function(result) {
                    if (!result) {
                        throw new Error('leave hangout fail');
                    }
                    actionContext.dispatch('CLOSE_OPEN_HANGOUT', {
                        channelId: cid
                    });
                });
        }).catch(function(err) {
            SharedUtils.printError('openHangout.js', 'core', err);
        });
};
