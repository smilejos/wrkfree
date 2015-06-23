'use strict';
var Promise = require('bluebird');
var CreateStore = require('fluxible/addons').createStore;
var SharedUtils = require('../../../sharedUtils/utils');

var OUTDATED_TIME_IN_MSECOND = 10000;

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


module.exports = CreateStore({
    storeName: 'DashboardStore',
    
    handlers: {
        'SET_DASHBOARD_LAYOUT': 'setLayout'
    },

    initialize: function() {
        this.isDashboardGrid = true;
        this.channels = null;
        this.isOutdated = true;
        this.outdatedTimer = null;
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: 
     *
     * @param {Object}       state.channels, an array of channel info
     */
    setLayout: function(data) {
        if (SharedUtils.isBoolean(data.isDashboardGrid)) {
            this.isDashboardGrid = data.isDashboardGrid;
            this.emitChange();
        }
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: polyfill dashboard state infomation
     *
     * @param {Object}       state.channels, an array of channel info
     */
    polyfillAsync: function(state) {
        return Promise.map(state.channels, function(item, index) {
            var hostIndex = 0;
            var members = SharedUtils.fastArrayMap(item.members.info, function(info, index) {
                if (info.uid === item.channel.host) {
                    hostIndex = index;
                }
                return {
                    uid: info.uid,
                    nickName: info.nickName,
                    avatar: info.avatar
                };
            });
            // return channel item object
            return {
                channelId: item.channel.channelId,
                channelName: item.channel.name,
                hostInfo: members.splice(hostIndex, 1)[0],
                memberList: members,
                snapshotUrl: Snapshots[index] || SnapshotError,
                isStarred: item.isStarred,
                isRtcOn: item.rtcStatus,
                visitTime: item.visitTime,
                lastBaord: item.lastBaord
            };
        }).bind(this).then(function(result) {
            this._setOutdatedTimer();
            this.channels = result;
            this.emitChange();
        }).catch(function(err) {
            SharedUtils.printError('DashboardStore', 'polyfillAsync', err);
            return null;
        });
    },

    /**
     * @Author: George_Chen
     * @Description: used to manage the outdated status of store
     */
    _setOutdatedTimer: function() {
        var self = this;
        self.isOutdated = false;
        if (this.outdatedTimer) {
            clearTimeout(this.outdatedTimer);
        }
        self.outdatedTimer = setTimeout(function() {
            self.isOutdated = true;
        }, OUTDATED_TIME_IN_MSECOND);
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: to check current store data is outdated or not
     */
    isStoreOutdated: function() {
        return this.isOutdated;
    },

    getState: function() {
        return {
            isDashboardGrid: this.isDashboardGrid,
            channels: this.channels
        };
    },

    dehydrate: function() {
        return this.getState();
    },

    rehydrate: function(state) {
        this.isDashboardGrid = state.isDashboardGrid;
        this.channels = state.channels;
        if (SharedUtils.isArray(this.channels)) {
            this._setOutdatedTimer();
        }
    }
});
