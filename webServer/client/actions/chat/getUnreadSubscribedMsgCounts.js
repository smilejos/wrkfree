'use strict';
var SharedUtils = require('../../../../sharedUtils/utils');
var ChatService = require('../../services/chatService');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: to get the unread subscribed message counts on starred channels
 * 
 * @param {Object}      actionContext, the fluxible's action context
 */
module.exports = function(actionContext) {
    return ChatService.getUnreadSubscribedMsgCounts()
        .then(function(result){
            if (!result) {
                throw new Error('get unread subscribed message counts error');
            }
            actionContext.dispatch('UPDATE_UNREAD_SUBSCRIBED_MSG_COUNTS', {
                channelsInfo: result
            });
        }).catch(function(err) {
            SharedUtils.printError('getUnreadSubscribedMsgCounts.js', 'core', err);
            return null;
        });
};
