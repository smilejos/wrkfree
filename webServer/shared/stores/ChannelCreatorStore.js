'use strict';
var CreateStore = require('fluxible/addons').createStore;
var SharedUtils = require('../../../sharedUtils/utils');
var Promise = require('bluebird');

module.exports = CreateStore({
    storeName: 'ChannelCreatorStore',

    handlers: {
        'ON_CHANNEL_CREATE': 'onChannelCreate'
    },


    initialize: function() {
        // test data for channelNav Info
        this.isActive = false;
        this.hasError = false;
        this.channelWillCreate = false;
        this.createdChannel = -1;
    },

    onChannelCreate: function(data) {
        this.createdChannel = data.channelInfo;
        this.emitChange();
    },

    /**
     * Public API
     * @Author: George_Chen
     * @Description: used to show or hide channelNav bar
     * NOTE: if is "isOpen" is invalid, we will change "actived" state different from current
     * 
     * @param {Boolean}        isOpen, to indicate channelNav bar should open or not
     */
    toggleAsync: function(isOpen) {
        var self = this;
        return Promise.try(function() {
            self.createdChannel = -1;
            self.isActive = (SharedUtils.isBoolean(isOpen) ? isOpen : !self.isActive);
            self.emitChange();
        });
    },

    getState: function() {
        return {
            channelWillCreate: this.channelWillCreate,
            isActive: this.isActive,
            hasError: this.hasError,
            createdChannel: this.createdChannel
        };
    },
});
