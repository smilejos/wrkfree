'use strict';
var CreateStore = require('fluxible/addons').createStore;
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
        'UPDATE_NOTIFICATIONS': '_updateNotifications',
        'TOGGLE_SUBSCRIPTIONLIST': '_deactiveNotification',
        'TOGGLE_FRIENDLIST': '_deactiveNotification',
        'TOGGLE_CHANNELCREATOR': '_deactiveNotification',
        'TOGGLE_QUICKSEARCH': '_deactiveNotification',
        'TOGGLE_PERSONALINFO': '_deactiveNotification',
        'TOGGLE_MAIN_VIEWPOINT': '_deactiveNotification'
    },

    initialize: function() {
        this.isActive = false;
        this.isOutdated = true;
        this.outdatedTimer = null;
        this.requests = [];
        this.notifications = [];
    },

    /**
     * @Author: George_Chen
     * @Description: to toggle the active status of notification list
     *
     * @param {Boolean}          data.isActive, indicate is active or not
     */
    _toggleNotification: function(data) {
        this.isActive = data.isActive;
        this.emitChange();
    },

    /**
     * @Author: George_Chen
     * @Description: to deactive notification list status
     *         NOTE: when other component is active, then deactive current component
     *
     * @param {Boolean}          data.isActive, indicate other component is active or not
     */
    _deactiveNotification: function(data) {
        if (data.isActive && this.isActive) {
            this.isActive = false;
            this.emitChange();
        }
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
        function _filterByReqId(item) {
            return (item.reqId !== notification.reqId);
        }
        return Promise.try(function() {
            self.requests = self.requests.filter(_filterByReqId);
            self.notifications = self.notifications.filter(_filterByReqId);
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
        return this.isActive;
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
            isActive: this.isActive,
            notifications: this.requests.concat(this.notifications)
        };
    }
});
