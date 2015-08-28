'use strict';
var CreateStore = require('fluxible/addons').createStore;
var SharedUtils = require('../../../sharedUtils/utils');
var Cache = require('lru-cache');

/**
 * InfoCard Store keep the state of all infocards
 */
module.exports = CreateStore({
    storeName: 'ChannelVisitorStore',

    handlers: {
        'UPDATE_CHANNEL_VISITORS': '_updateChannelVisitors',
        'ON_CHANNEL_VISITOR_ADD': '_onVisitorAdded',
        'ON_CHANNEL_VISITOR_REMOVE': '_onVisitorRemoved'
    },

    initialize: function() {
        this.channels = Cache();
    },

    /**
     * @Author: George_Chen
     * @Description: update the search results
     */
    _updateChannelVisitors: function(data) {
        if (!data.visitors) {
            return this.channels.del(data.channelId);
        }
        this.channels.set(data.channelId, data.visitors);
        this.emitChange();
    },

    /**
     * Public API
     * @Author: George_Chen
     * @Description: remove uid from channel visitors
     *               
     * @param {String}          data.channelId, the channel id
     * @param {String}          data.uid, the visitor uid
     * @param {Object}          data.visitorInfo, the visitor's info
     */
    _onVisitorAdded: function(data) {
        var visitors = this.channels.get(data.channelId);
        var isVisited;
        if (visitors) {
            SharedUtils.fastArrayMap(visitors, function(info) {
                if (info.uid === data.uid) {
                    isVisited = true;
                }
            });
            if (!isVisited) {
                visitors.push(data.visitorInfo);
            }
            this.channels.set(data.channelId, visitors);
            this.emitChange();
        }
    },

    /**
     * Public API
     * @Author: George_Chen
     * @Description: remove uid from channel visitors
     *               
     * @param {String}          data.channelId, the channel id
     * @param {String}          data.uid, the visitor uid
     */
    _onVisitorRemoved: function(data) {
        var visitors = this.channels.get(data.channelId);
        var list;
        if (visitors) {
            list = visitors.filter(function(info) {
                return (info.uid !== data.uid);
            });
            this.channels.set(data.channelId, list);
            this.emitChange();
        }
    },

    /**
     * Public API
     * @Author: George_Chen
     * @Description: check target user has visited channel or not
     *               
     * @param {String}          channelId, the channel id
     * @param {String}          target, the target uid
     */
    hasVisited: function(channelId, target) {
        var visitors = this.channels.get(channelId);
        var isVisited = false;
        if (!visitors) {
            return null;
        }
        SharedUtils.fastArrayMap(visitors, function(info) {
            if (info.uid === target) {
                isVisited = true;
            }
        });
        return isVisited;
    },

    /**
     * Public API
     * @Author: George_Chen
     * @Description: get current channel visitors
     *               
     * @param {String}          channelId, the channel id
     */
    getVisitors: function(channelId) {
        var visitors = this.channels.get(channelId);
        return (visitors ? visitors : []);
    }
});
