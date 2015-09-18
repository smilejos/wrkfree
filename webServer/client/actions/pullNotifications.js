'use strict';
var UserService = require('../services/userService');
var SharedUtils = require('../../../sharedUtils/utils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: to pull user's notifications
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Boolean}     data.isReaded, to indicate pull targets is readed or unreaded
 */
module.exports = function(actionContext, data) {
    return UserService.getNotificationsAsync({
        isReaded: data.isReaded
    }).then(function(recvData) {
        return Promise.props({
            reqResps: _parseResults(recvData.reqResps),
            notifications: _parseResults(recvData.notifications),
        });
    }).then(function(results) {
        var notifications = results.reqResps.concat(results.notifications);
        actionContext.dispatch('UPDATE_NOTIFICATIONS', notifications);
    }).catch(function(err) {
        SharedUtils.printError('pullNotifications.js', 'core', err);
    });
};

/**
 * @Author: George_Chen
 * @Description: to pull user's notifications
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Boolean}     data.isReaded, to indicate pull targets is readed or unreaded
 */
function _parseResults(results) {
    return Promise.map(results, function(item) {
        return UserService.getInfoAsync(item.sender)
            .then(function(senderInfo) {
                item.sender = senderInfo;
                return item;
            });
    });
}
