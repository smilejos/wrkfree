'use strict';
var CreateStore = require('fluxible/utils/createStore');
var Cache = require('lru-cache');
var CachePolicy = {
    // the maximum number of key-value pair
    max: 100,
    // each key-value ttl in mseconds
    maxAge: 20000
};


module.exports = CreateStore({
    storeName: 'QuickSearchStore',

    handlers: {
        'ON_QUICKSEARCH_UPDATE': '_onQuickSearchUpdate',
        'ON_QUICKSEARCH_CACHE_HIT': '_onQuickSearchCacheHit',
    },

    /**
     * @Author: George_Chen
     * @Description: update the search results
     *
     * @param {Array}          data.channels, the search results of channels
     * @param {Array}          data.users, the search results of users
     */
    _onQuickSearchUpdate: function(data) {
        this.dispatcher.waitFor('InfoCardStore', function() {
            this.channelQueries.set(data.query, data.channels.keys);
            this.userQueries.set(data.query, data.users.keys);
            this.currentQuery = data.query;
            this.emitChange();
        }.bind(this));
    },

    /**
     * @Author: George_Chen
     * @Description: update the current query string when query hit store cache
     *
     * @param {String}         query, the search query string
     */
    _onQuickSearchCacheHit: function(query) {
        this.currentQuery = query;
        this.emitChange();
    },

    /**
     * Public API
     * @Author: George_Chen
     * @Description: to check store has cached current query string or not
     *
     * @param {String}         query, the search query string
     */
    hasCached: function(query) {
        return (this.userQueries.has(query) || this.channelQueries.has(query));
    },

    /**
     * Public API
     * @Author: George_Chen
     * @Description: to set the enable status of quickSearch
     *
     * @param {Boolean}          isEnabled, enable quickSearch or not
     */
    enableSearch: function(isEnabled) {
        this.isEnabled = isEnabled;
        this.emitChange();
    },

    initialize: function() {
        this.isEnabled = false;
        this.currentQuery = null;
        this.userQueries = Cache(CachePolicy);
        this.channelQueries = Cache(CachePolicy);
    },

    getState: function() {
        var query = this.currentQuery;
        return {
            isEnabled: this.isEnabled,
            results: {
                channels: this.channelQueries.get(query) || [],
                users: this.userQueries.get(query) || []
            }
        };
    }
});
