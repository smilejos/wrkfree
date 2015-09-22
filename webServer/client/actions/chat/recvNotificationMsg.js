'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var WorkSpaceStore = require('../../../shared/stores/WorkSpaceStore');
var HangoutStore = require('../../../shared/stores/HangoutStore');
var SubscriptionStore = require('../../../shared/stores/SubscriptionStore');
var PlaySystemSound = require('../playSystemSound');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: for handling received channel notification message
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Array}       data.channels, a array of channel ids
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        message: SharedUtils.argsCheckAsync(data.message, 'string'),
        from: SharedUtils.argsCheckAsync(data.from, 'md5'),
        sentTime: SharedUtils.argsCheckAsync(data.sentTime, 'number')
    }).then(function(recvMsg) {
        var workspaceStore = actionContext.getStore(WorkSpaceStore);
        var hangoutStore = actionContext.getStore(HangoutStore);
        var subscriptionStore = actionContext.getStore(SubscriptionStore);
        var cid = recvMsg.channelId;
        if (!workspaceStore.isOpenedChannel(cid) && !hangoutStore.isHangoutExist(cid)) {
            if (!subscriptionStore.isChannelStarred(cid)) {
                actionContext.executeAction(PlaySystemSound, {
                    type: 'message'
                });
            }
            return actionContext.dispatch('RECV_NOTIFICATION_MESSAGE', recvMsg);
        }
    }).catch(function(err) {
        SharedUtils.printError('recvNotificationMsg.js', 'core', err);
        return null;
    });
};
