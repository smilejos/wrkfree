'use strict';
var CreateStore = require('fluxible/utils/createStore');
var SharedUtils = require('../../../sharedUtils/utils');
var Promise = require('bluebird');

var OUTDATED_TIME_IN_MSECOND = 10000;

/**
 * used to keep user's notifications
 */
module.exports = CreateStore({
    storeName: 'NotificationStore',

    handlers: {
        'ON_NOTIFICATION': '_onNotification',
        'TOGGLE_NOTIFICATION': '_toggleNotification',
        'DELETE_NOTIFICATION': '_deleteNotification',
        'UPDATE_NOTIFICATIONS': '_updateNotifications'
    },

    initialize: function() {
        this.isVisible = false;
        this.isOutdated = true;
        this.outdatedTimer = null;
        this.requests = [];
        this.notifications = [];
    },

    /**
     * @Author: George_Chen
     * @Description: for user to control notifications should be shown ro not
     *
     * @param {Boolean}      isVisible, control notifications shown status
     */
    _toggleNotification: function(data) {
        this.isVisible = data.isVisible;
        this.emitChange();
    },

    /**
     * @Author: George_Chen
     * @Description: for user to update current notifications on store
     *
     * @param {Array}      notifications, an array of notifications
     */
    _updateNotifications: function(notifications) {
        var requests = [];
        var others = [];
        var self = this;

        function _sortDescByTime(obj1, obj2) {
            return (obj2.updatedTime > obj1.updatedTime);
        }
        return Promise.map(notifications, function(item) {
            return (item.isReq ? requests.push(item) : others.push(item));
        }).then(function() {
            requests.sort(_sortDescByTime);
            others.sort(_sortDescByTime);
        }).then(function() {
            self.requests = requests;
            self.notifications = others;
            self._setOutdatedTimer();
            self.emitChange();
        }).catch(function(err) {
            SharedUtils.printError('NotificationStore', '_updateNotifications', err);
        });
    },

    /**
     * TODO: we should use id to replace reqId in the future
     * @Author: George_Chen
     * @Description: for user to delete target notification
     *
     * @param {Object}      notification, an notification object
     */
    _deleteNotification: function(notification) {
        var self = this;
        return Promise.try(function() {
            return (notification.isReq ? self.requests : self.notifications);
        }).then(function(array) {
            for (var i = 0; i < array.length; ++i) {
                if (notification.reqId === array[i].reqId) {
                    return array.splice(i, 1);
                }
            }
        }).then(function() {
            self.emitChange();
        }).catch(function(err) {
            SharedUtils.printError('NotificationStore', '_deleteNotification', err);
        });
    },

    /**
     * Public API
     * @Author: George_Chen
     * @Description: to check notifications is visible or not
     */
    isNotificationShown: function() {
        return this.isVisible;
    },

    /**
     * Public API
     * @Author: George_Chen
     * @Description: to check the store is outdated or not
     */
    isStoreOutdated: function() {
        return this.isOutdated;
    },

    /**
     * @Author: George_Chen
     * @Description: handling new received notification
     *
     * @param {Object}          data, the new coming notification
     */
    _onNotification: function(data) {
        if (data.isReq) {
            this.requests.unshift(data);
        } else {
            this.notifications.unshift(data);
        }
        this._setOutdatedTimer();
        this.emitChange();
    },

    /**
     * @Author: George_Chen
     * @Description: used to manage the outdated status of store
     */
    _setOutdatedTimer: function() {
        var self = this;
        self.isOutdated = false;
        if (this.outdatedTimer) {
            clearTimeout(this.outdatedTimer);
        }
        self.outdatedTimer = setTimeout(function() {
            self.isOutdated = true;
        }, OUTDATED_TIME_IN_MSECOND);
    },

    getState: function() {
        return {
            isVisible: this.isVisible,
            notifications: this.requests.concat(this.notifications)
        };
    }
});
