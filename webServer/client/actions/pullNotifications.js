'use strict';
var UserService = require('../services/userService');
var SharedUtils = require('../../../sharedUtils/utils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: to pull user's notifications
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Boolean}     data.isReaded, to indicate 
 */
module.exports = function(actionContext, data) {
    return UserService.getNotificationsAsync({
        isReaded: data.isReaded
    }).map(function(notification) {
        return UserService.getInfoAsync(notification.sender)
            .then(function(senderInfo) {
                notification.sender = senderInfo;
                return notification;
            });
    }).then(function(notifications) {
        if (notifications.length > 0) {
            actionContext.dispatch('UPDATE_NOTIFICATIONS', notifications);
        }
        // TODO: what if no notifications ?
    }).catch(function(err) {
        SharedUtils.printError('pullNotifications.js', 'core', err);
    });
};
