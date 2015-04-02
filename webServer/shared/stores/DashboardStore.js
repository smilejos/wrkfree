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
    'http://goo.gl/00t6Mh'
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
            var host;
            // extract host info from members
            for (var i=0;i<item.members.info.length; ++i) {
                if (item.members.info[i]._id.equals(hostUid)) {
                    host = item.members.info.splice(i, 1)[0];
                    break;
                }
            }
            // return channel item object
            return {
                channelId: item.channelId,
                channelName: partialChannelName,
                hostInfo: host,
                memberList: item.members.info,
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
