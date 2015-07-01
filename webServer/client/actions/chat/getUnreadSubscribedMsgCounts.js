'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var ChatService = require('../../services/chatService');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: 
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Array}      data.channels, a array of channel ids
 */
module.exports = function(actionContext, data) {
    return ChatService.getUnreadSubscribedMsgCounts()
        .then(function(result){
            if (!result) {
                throw new Error('get unread subscribed message counts error');
            }
            actionContext.dispatch('UPDATE_UNREAD_SUBSCRIBED_MSG_COUNTS', {
                channelsInfo: result
            });
        }).catch(function(err) {
            SharedUtils.printError('recvMessage.js', 'core', err);
            return null;
        });
};
