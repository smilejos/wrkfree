'use strict';
var createStore = require('fluxible/utils/createStore');

var HeaderStore = createStore({
    storeName: 'HeaderStore',

    initialize: function() {
        this.user = {};
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
        this.user = {
            uid: state.user.email,
            avatar: state.user.avatar,
            name: state.user.name
        };
        this.hasUnreadMsgs = state.hasUnreadMsgs;
        this.hasNotification = state.hasNotification;
        this.emitChange();
    },

    getState: function() {
        return {
            userInfo: this.user,
            hasUnreadMsgs: this.hasUnreadMsgs,
            hasNotification: this.hasNotification,
        };
    },

    dehydrate: function() {
        return this.getState();
    },

    rehydrate: function(state) {
        this.user = state.userInfo;
    }
});


module.exports = HeaderStore;
