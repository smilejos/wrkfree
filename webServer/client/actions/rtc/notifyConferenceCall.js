'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var ActionUtils = require('../actionUtils');
var SubscriptionStore = require('../../../shared/stores/SubscriptionStore');
var PlaySystemSound = require('../playSystemSound');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: used to notify conference notification state
 *         NOTE: different from "onConference" action, this action only triggered
 *               when user has incoming call and not enter specific channel
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, the channel id
 * @param {Boolean}     data.hasCall, to indicate conference notification state
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        hasCall: SharedUtils.argsCheckAsync(data.hasCall, 'boolean'),
    }).then(function(recvData) {
        var subscriptionStore = actionContext.getStore(SubscriptionStore);
        if (!subscriptionStore.isChannelStarred(recvData.channelId) && recvData.hasCall) {
            actionContext.executeAction(PlaySystemSound, {
                type: 'phonecall'
            });
        }
        actionContext.dispatch('RECV_NOTIFICATION_CONFERENCE', recvData);
    }).catch(function(err) {
        SharedUtils.printError('notifyConference.js', 'core', err);
        ActionUtils.showErrorEvent('Error', 'handle conference notification fail');
    });
};
