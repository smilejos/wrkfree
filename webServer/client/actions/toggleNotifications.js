'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');
var NotificationStore = require('../../shared/stores/NotificationStore');
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
        actionContext.dispatch('TOGGLE_NOTIFICATION', {
            isVisible: toggleState
        });
        if (toggleState && store.isStoreOutdated()) {
            actionContext.executeAction(PullNotifications, {
                isReaded: false
            });
        }
    }).catch(function(err) {
        SharedUtils.printError('toggleNotifications.js', 'core', err);
    });
};
