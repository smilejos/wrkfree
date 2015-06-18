'use strict';
var Promise = require('bluebird');
var CreateStore = require('fluxible/addons').createStore;
var SharedUtils = require('../../../sharedUtils/utils');

var HeaderStore = CreateStore({
    storeName: 'HeaderStore',
    handlers: {
        'ON_NOTIFY': '_onNotify',
        'ON_MSG_NOTIFY': '_onMsgNotify',
        'TOGGLE_QUICKSEARCH': '_toggleQuickSearch'
    },

    initialize: function() {
        this.user = {};
        this.isSearchable = false;
    },

    /**
     * @Author: George_Chen
     * @Description: for updating the notification state
     *
     * @param {Boolean}      hasNotify, notification state
     */
    _onNotify: function(hasNotify) {
        this.hasNotification = hasNotify;
        this.emitChange();
    },

    /**
     * @Author: George_Chen
     * @Description: for updating the unread message state
     *
     * @param {Boolean}      hasNotify, notification state
     */
    _onMsgNotify: function(hasNotify) {
        this.hasUnreadMsgs = hasNotify;
        this.emitChange();
    },

    /**
     * @Author: George_Chen
     * @Description: to update the status of quick search bar
     *
     * @param {Boolean}      data.isEnabled, indicate quickSearch is enable or not
     */
    _toggleQuickSearch: function(data) {
        this.isSearchable = data.isEnabled;
        this.emitChange();
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: polyfill header infomation
     *
     * @param {Object}       state.user, login user's info
     * @param {Boolean}      state.isMsgRead, login user has unread msg or not
     * @param {Boolean}      state.hasNotification, login user has notification or not
     */
    polyfillAsync: function(state) {
        var self = this;
        return Promise.try(function() {
            self.user = {
                uid: state.user.uid,
                avatar: state.user.avatar,
                nickName: state.user.nickName
            };
            self.hasUnreadMsgs = state.hasUnreadMsgs;
            self.hasNotification = state.hasNotification;
            self.emitChange();
        }).catch(function(err) {
            SharedUtils.printError('HeaderStore.js', 'polyfillAsync', err);
            throw err;
        });
    },

    /**
     * Public API
     * @Author: George_Chen
     * @Description: for getting current user's self information
     */
    getSelfInfo: function() {
        return this.user;
    },

    getState: function() {
        return {
            userInfo: this.user,
            hasUnreadMsgs: this.hasUnreadMsgs,
            hasNotification: this.hasNotification,
            isSearchable: this.isSearchable
        };
    },

    dehydrate: function() {
        return this.getState();
    },

    rehydrate: function(state) {
        this.user = state.userInfo;
        this.hasUnreadMsgs = state.hasUnreadMsgs;
        this.hasNotification = state.hasNotification;
    }
});


module.exports = HeaderStore;
