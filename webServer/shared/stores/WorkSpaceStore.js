'use strict';
var Promise = require('bluebird');
var CreateStore = require('fluxible/utils/createStore');
var SharedUtils = require('../../../sharedUtils/utils');

module.exports = CreateStore({
    storeName: 'WorkSpaceStore',

    initialize: function() {
        this.channel = {};
        this.members = {};
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: polyfill the state of current store
     *
     * @param {Object}      state, the state of workSpace store
     */
    polyfillAsync: function(state) {
        var self = this;
        return Promise.try(function() {
            self.channel = state.channel;
            self.members = state.members;
        }).then(function() {
            self.emitChange();
        }).catch(function(err) {
            SharedUtils.printError('WorkSpaceStore.js', 'polyfillAsync', err);
        });
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: used to check current store is polyfilled or not
     *
     * @param {String}      channelId, channel's id
     */
    isPolyFilled: function(channelId) {
        return (this.channel.channelId === channelId);
    },

    getState: function() {
        return {
            channel: this.channel,
            members: this.members
        };
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: dehydrate mechanism will be called by fluxible framework
     */
    dehydrate: function() {
        return this.getState();
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: rehydrate mechanism will be called by fluxible framework
     *
     * @param {String}      state, the stringify state returned by "dehydrate"
     */
    rehydrate: function(state) {
        this.channel = state.channel;
        this.members = state.members;
    }
});
