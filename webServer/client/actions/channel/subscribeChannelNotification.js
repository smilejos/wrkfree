'use strict';
var ChannelService = require('../../services/channelService');
var SharedUtils = require('../../../../sharedUtils/utils');
var ActionUtils = require('../actionUtils');


/**
 * @Public API
 * @Author: George_Chen
 * @Description: to subscribe notifications on current channel
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, target channel id
 */
module.exports = function(actionContext, data) {
    return SharedUtils.argsCheckAsync(data.channelId, 'md5')
        .then(function(cid) {
            return ChannelService.subscribeNotificationAsync(cid)
                .then(function(result) {
                    if (!result) {
                        _failRetryHandler(actionContext, cid);
                    }
                    return result;
                });
        }).catch(function(err) {
            SharedUtils.printError('subscribeChannelNotification.js', 'core', err);
            ActionUtils.showErrorEvent('channel', 'track channel notification fail');
        });
};

/**
 * @Author: George_Chen
 * @Description: to do a re-subscribe on fail subscribed channel
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.failChannelId, fail subscribed channel id
 */
function _failRetryHandler(actionContext, failChannelId) {
    ActionUtils.showWarningEvent(
        'Channel',
        'subscribe channel notifications fail',
        'retry',
        function(cid) {
            var action = require('./subscribeChannelNotification');
            actionContext.executeAction(action, {
                channelId: cid
            });
        }.bind(null, failChannelId));
}
