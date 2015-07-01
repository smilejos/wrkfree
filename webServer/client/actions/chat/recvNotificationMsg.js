'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var WorkSpaceStore = require('../../../shared/stores/WorkSpaceStore');
var HangoutStore = require('../../../shared/stores/HangoutStore');

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
        from: SharedUtils.argsCheckAsync(data.from, 'md5')
    }).then(function(recvMsg) {
        var workspaceStore = actionContext.getStore(WorkSpaceStore);
        var hangoutStore = actionContext.getStore(HangoutStore);
        var cid = recvMsg.channelId;
        if (!workspaceStore.isOpenedChannel(cid) && !hangoutStore.isHangoutExist(cid)) {
            return actionContext.dispatch('RECV_NOTIFICATION_MESSAGE', recvMsg);
        }
    }).catch(function(err) {
        SharedUtils.printError('recvNotificationMsg.js', 'core', err);
        return null;
    });
};
