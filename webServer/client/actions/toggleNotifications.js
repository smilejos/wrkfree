'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');
var UserService = require('../services/userService');
var NotificationStore = require('../../shared/stores/NotificationStore');
var HeaderStore = require('../../shared/stores/HeaderStore');
var PullNotifications = require('./pullNotifications');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: toggle the notification icon on header
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Boolean}     data.isVisible, indicate component is visible or not
 */
module.exports = function(actionContext, data) {
    var store = actionContext.getStore(NotificationStore);
    return Promise.try(function() {
        if (SharedUtils.isBoolean(data.isVisible)) {
            return data.isVisible;
        }
        return !store.isNotificationShown();
    }).then(function(toggleState) {
        if (toggleState && store.isStoreOutdated()) {
            actionContext.executeAction(PullNotifications, {
                isReaded: false
            });
        }
        return _resetUnreadNotice(actionContext, toggleState);
    }).catch(function(err) {
        SharedUtils.printError('toggleNotifications.js', 'core', err);
    });
};

/**
 * @Author: George_Chen
 * @Description: to reset user's unread notice counts
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Boolean}     toggleState, notification toggle state
 */
function _resetUnreadNotice(actionContext, toggleState) {
    return Promise.try(function() {
        var headerStore = actionContext.getStore(HeaderStore);
        var unreadNoticeCounts = headerStore.getState().unreadNoticeCounts;
        if (unreadNoticeCounts === 0) {
            return true;
        }
        return UserService.resetUnreadNoticeAsync();
    }).then(function(result) {
        var err = new Error('clean notice fail on server');
        if (!result) {
            SharedUtils.printError('toggleNotifications.js', '_resetUnreadNotice', err);
        }
        actionContext.dispatch('TOGGLE_NOTIFICATION', {
            isVisible: toggleState
        });
    });
}
