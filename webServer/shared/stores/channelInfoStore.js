'use strict';
var CreateStore = require('fluxible/utils/createStore');
var Promise = require('bluebird');

/**
 * Channel Infomations, currently hardcode it
 */
var Channels = {
    '5e2e717e84acd6518bbcd43570742d3f': {
        msgHeader: 'To Jos'
    }
};

var ChannelInfoStore = CreateStore({
    storeName: 'ChannelInfoStore',
    /**
     * Public API
     * @Author: George_Chen
     * @Description: for getting specific channel's info
     *
     * @param {String}      channelId, channel id
     */
    getChannelAsync: function(channelId) {
        return Promise.try(function() {
            if (Channels[channelId]) {
                return Channels[channelId];
            }
            return {};
        }).catch(function(err) {
            console.log('[getChannelAsync]', err);
            return {};
        });
    }
});

module.exports = ChannelInfoStore;
