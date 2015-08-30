'use strict';
var CreateStore = require('fluxible/addons').createStore;

module.exports = CreateStore({
    storeName: 'ChannelCreatorStore',

    handlers: {
        'ON_CHANNEL_CREATE': 'onChannelCreate',
        'TOGGLE_CHANNELCREATOR': '_toggleChannelCreator',
        'TOGGLE_SUBSCRIPTIONLIST': '_deactiveChannelCreator',
        'TOGGLE_FRIENDLIST': '_deactiveChannelCreator',
        'TOGGLE_QUICKSEARCH': '_deactiveChannelCreator',
        'TOGGLE_PERSONALINFO': '_deactiveChannelCreator',
        'TOGGLE_NOTIFICATION': '_deactiveChannelCreator',
        'TOGGLE_MAIN_VIEWPOINT': '_deactiveChannelCreator'
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
     * @Author: George_Chen
     * @Description: to toggle the active status of channel creator
     *
     * @param {Boolean}          data.isActive, indicate is active or not
     */
    _toggleChannelCreator: function(data) {
        this.isActive = data.isActive;
        this.emitChange();
    },

    /**
     * @Author: George_Chen
     * @Description: to deactive channel creator status
     *         NOTE: when other component is active, then deactive current component
     *
     * @param {Boolean}          data.isActive, indicate other component is active or not
     */
    _deactiveChannelCreator: function(data) {
        if (data.isActive && this.isActive) {
            this.isActive = false;
            this.emitChange();
        }
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
