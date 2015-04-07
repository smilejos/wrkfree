'use strict';
var Promise = require('bluebird');
var createStore = require('fluxible/utils/createStore');
var SharedUtils = require('../../../sharedUtils/utils');

/**
 * Test data
 */
var SnapshotError = 'http://goo.gl/K3xfRt';
var Snapshots = [
    'https://goo.gl/gNVk1j',
    'https://goo.gl/agVedj',
    'https://goo.gl/YqzlWS',
    'https://goo.gl/0DxoSH',
    'https://goo.gl/VXPGaZ',
    'https://goo.gl/00t6Mh'
];


module.exports = createStore({
    storeName: 'DashboardStore',

    initialize: function() {
        this.layout = 'grid';
        this.channels = [];
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: polyfill dashboard state infomation
     *
     * @param {String}       state.layout, the channel stream layout
     * @param {Object}       state.channels, an array of channel info
     */
    polyfillAsync: function(state) {
        this.layout = state.layout || 'grid';
        return Promise.map(state.channels, function(item, index) {
            var channelNameInfo = item.channelName.split('#');
            var hostUid = channelNameInfo[0];
            var partialChannelName = channelNameInfo[1];
            var hostIndex = 0;
            var members = SharedUtils.fastArrayMap(item.members.info, function(info, index) {
                if (info._id.equals(hostUid)) {
                    hostIndex = index;
                }
                return {
                    uid: info._id,
                    nickName: info.nickName,
                    avatar: info.avatar
                };
            });
            // return channel item object
            return {
                channelId: item.channelId,
                channelName: partialChannelName,
                hostInfo: members.splice(hostIndex, 1)[0],
                memberList: members,
                snapshotUrl: Snapshots[index] || SnapshotError,
                isSubscribed: item.isSubscribed,
                isRtcOn: item.rtcStatus,
                visitTime: item.visitTime
            };
        }).bind(this).then(function(result) {
            this.channels = result;
            this.emitChange();
        }).catch(function(err) {
            SharedUtils.printError('DashboardStore', 'polyfillAsync', err);
            return null;
        });
    },

    getState: function() {
        return {
            layout: this.layout,
            channels: this.channels
        };
    },

    dehydrate: function() {
        return this.getState();
    },

    rehydrate: function(state) {
        this.layout = state.layout;
        this.channels = state.channels;
    }
});
