'use strict';
var Promise = require('bluebird');
var ChannelService = require('../../services/channelService');
var SharedUtils = require('../../../../sharedUtils/utils');
var ActionUtils = require('../actionUtils');


/**
 * @Public API
 * @Author: George_Chen
 * @Description: to subscribe notifications on group of channels
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channels, target channels
 */
module.exports = function(actionContext, data) {
    var failSubscriptions = [];
    return Promise.map(data.channels, function(channelId) {
        return SharedUtils.argsCheckAsync(channelId, 'md5');
    }).map(function(cid) {
        return ChannelService.subscribeNotificationAsync(cid)
            .then(function(result) {
                if (!result) {
                    failSubscriptions.push(cid);
                }
                return true;
            });
    }).then(function() {
        if (failSubscriptions.length > 0) {
            _failRetryHandler(actionContext, failSubscriptions);
        }
    }).catch(function(err) {
        SharedUtils.printError('subscribeChannelNotification.js', 'core', err);
        ActionUtils.showErrorEvent('notifications', 'subscribe notifications fail');
    });
};

/**
 * @Author: George_Chen
 * @Description: to do a re-subscribe on fail subscribed channels
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      targets, fail subscribed channels 
 */
function _failRetryHandler(actionContext, targets) {
    ActionUtils.showWarningEvt(
        'notifications',
        'subscribe starred channels fail',
        'retry',
        function(failChannels) {
            var action = require('./subscribeChannelNotification');
            actionContext.executeAction(action, {
                channels: failChannels
            });
        }.bind(null, targets));
}
