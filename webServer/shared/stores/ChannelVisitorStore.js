'use strict';
var CreateStore = require('fluxible/addons').createStore;
var Cache = require('lru-cache');

var STORE_TIMEOUT_IN_MSECOND = 300000;

/**
 * InfoCard Store keep the state of all infocards
 */
module.exports = CreateStore({
    storeName: 'ChannelVisitorStore',

    handlers: {
        'UPDATE_CHANNEL_VISITORS': '_updateChannelVisitors'
    },

    initialize: function() {
        this.channels = Cache({
            maxAge: STORE_TIMEOUT_IN_MSECOND
        });
    },

    /**
     * @Author: George_Chen
     * @Description: update the search results
     */
    _updateChannelVisitors: function(data) {
        this.channels.set(data.channelId, data.visitors, STORE_TIMEOUT_IN_MSECOND);
        this.emitChange();
    },

    /**
     * Public API
     * @Author: George_Chen
     * @Description: get the card state based on  card id
     *         NOTE: for user card, the cardId is user's uid;
     *               for channel card, the cardId is channel's id
     *               
     * @param {String}          cardId, the info card id
     */
    getVisitors: function(cid) {
        var vistors = this.channels.get(cid);
        return (vistors ? vistors : []);
    }
});
