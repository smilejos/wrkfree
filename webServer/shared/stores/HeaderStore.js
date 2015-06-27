'use strict';
var Promise = require('bluebird');
var CreateStore = require('fluxible/addons').createStore;
var SharedUtils = require('../../../sharedUtils/utils');

var HeaderStore = CreateStore({
    storeName: 'HeaderStore',
    handlers: {
        'TOGGLE_QUICKSEARCH': '_toggleQuickSearch',
        'TOGGLE_NOTIFICATION': '_toggleNotification',
        'UPDATE_HEADER_CONVERSATIONS': '_updateUnreadConversations',
        'ON_NOTIFICATION': '_onNotification'
    },

    initialize: function() {
        this.user = {};
        this.isSearchable = false;
        this.unreadDiscussions = 0;
        this.unreadConversations = 0;
        this.unreadNoticeCounts = 0;
    },

    /**
     * @Author: George_Chen
     * @Description: to update the status of friendMsg counts
     *
     * @param {Number}      data.counts, the unread friendMsg counts
     */
    _updateUnreadConversations: function(data) {
        this.unreadConversations = data.counts;
        this.emitChange();
    },

    _onNotification: function() {
        ++this.unreadNoticeCounts;
        this.emitChange();
    },

    _toggleNotification: function() {
        this.unreadNoticeCounts = 0;
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
                uid: state.uid,
                avatar: state.avatar,
                nickName: state.nickName
            };
            self.unreadNoticeCounts = state.unreadNoticeCounts;
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
            unreadDiscussions: this.unreadDiscussions,
            unreadConversations: this.unreadConversations,
            unreadNoticeCounts: this.unreadNoticeCounts,
            isSearchable: this.isSearchable
        };
    },

    dehydrate: function() {
        return this.getState();
    },

    rehydrate: function(state) {
        this.user = state.userInfo;
        this.unreadConversations = state.unreadConversations;
        this.unreadNoticeCounts = state.unreadNoticeCounts;
        this.unreadDiscussions = state.unreadDiscussions;
    }
});


module.exports = HeaderStore;
