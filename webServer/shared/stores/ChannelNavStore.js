'use strict';
var createStore = require('fluxible/utils/createStore');
var SharedUtils = require('../../../sharedUtils/utils');
var Promise = require('bluebird');


module.exports = createStore({
    storeName: 'ChannelNavStore',

    handlers: {
        'ON_CHANNEL_CREATE': 'onChannelCreate'
    },

    initialize: function() {
        // test data for channelNav Info
        this.navInfo = [{
            channelId: 'e8075f24e77e220c056ab1926be69cf7',
            partialChannelName: 'wrkfree',
            hostName: 'GeorgeChen'
        }, {
            channelId: 'test1234',
            partialChannelName: 'Development',
            hostName: 'Normanywei'
        }, {
            channelId: 'test12356789',
            partialChannelName: 'UI',
            hostName: 'SmileJos'
        }];
        this.isActived = false;
        this.isNameValid = false;        
        // use "-1" to indicate that no channel create action
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
            self.isActived = (SharedUtils.isBoolean(isOpen) ? isOpen : !self.isActived);
            self.emitChange();
        });
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: polyfill header infomation
     * NOTE: TODO later
     */
    polyfillAsync: function() {
        this.emitChange();
    },

    getState: function() {
        return {
            createdChannel: this.createdChannel,
            isNameValid: this.isNameValid,
            isActived: this.isActived,
            navInfo: this.navInfo
        };
    },

    dehydrate: function() {
        return this.getState();
    },

    rehydrate: function(state) {
        this.navInfo = state.navInfo;
        this.isActived = state.isActived;
        this.isNameValid = state.isNameValid;
    }
});
