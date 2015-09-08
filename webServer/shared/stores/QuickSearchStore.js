'use strict';
var CreateStore = require('fluxible/addons').createStore;
var Cache = require('lru-cache');
var CACHE_TIMEOUT_IN_MSECOND = 20000;


module.exports = CreateStore({
    storeName: 'QuickSearchStore',

    handlers: {
        'ON_SEARCHING': '_onSearching',
        'ON_QUICKSEARCH_UPDATE': '_onQuickSearchUpdate',
        'ON_QUICKSEARCH_CACHE_HIT': '_onQuickSearchCacheHit',
        'TOGGLE_QUICKSEARCH': '_toggleQuickSearch',
        'TOGGLE_SUBSCRIPTIONLIST': '_deactiveQuickSearch',
        'TOGGLE_FRIENDLIST': '_deactiveQuickSearch',
        'TOGGLE_CHANNELCREATOR': '_deactiveQuickSearch',
        'TOGGLE_PERSONALINFO': '_deactiveQuickSearch',
        'TOGGLE_NOTIFICATION': '_deactiveQuickSearch',
        'TOGGLE_MAIN_VIEWPOINT': '_deactiveQuickSearch',
        'TOGGLE_SEARCH_MODE': '_toggleSearchMode'
    },

    _onSearching: function() {
        this.isActive = true;
        this.isSearching = true;
        this.emitChange();
    },

    _toggleSearchMode: function(data) {
        this.isGridResults = data.isGridResults;
        this.emitChange();
    },

    /**
     * @Author: George_Chen
     * @Description: update the search results
     *         NOTE: we only keep the index(keys) of search results on store
     *         
     * @param {String}         data.query, the search query string 
     * @param {Array}          data.channels, the search results of channels
     * @param {Array}          data.users, the search results of users
     */
    _onQuickSearchUpdate: function(data) {
        this.dispatcher.waitFor('InfoCardStore', function() {
            this.channelQueries.set(data.query, data.channels.keys);
            this.userQueries.set(data.query, data.users.keys);
            this.currentQuery = data.query;
            this.isSearching = false;
            this.emitChange();
        }.bind(this));
    },

    /**
     * @Author: George_Chen
     * @Description: update the current query string when cache hit
     *         NOTE: if query hit local cache, then we update the query and inform
     *               the listener component to updtae its view
     *
     * @param {String}         query, the search query string
     */
    _onQuickSearchCacheHit: function(query) {
        this.currentQuery = query;
        this.isSearching = false;
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
     * @Author: George_Chen
     * @Description: to toggle the active status of quickSearch
     *
     * @param {Boolean}          data.isActive, indicate is active or not
     */
    _toggleQuickSearch: function(data) {
        this.isActive = data.isActive;
        if (!data.isActive) {
            this.currentQuery = null;
            this.isSearching = false;
        }
        this.emitChange();
    },

    /**
     * @Author: George_Chen
     * @Description: to deactive quicksearch status
     *         NOTE: when other component is active, then deactive current component
     *
     * @param {Boolean}          data.isActive, indicate other component is active or not
     */
    _deactiveQuickSearch: function(data) {
        if (data.isActive && this.isActive) {
            this.isActive = false;
            this.isSearching = false;
            this.currentQuery = null;
            this.emitChange();
        }
    },

    initialize: function() {
        var CachePolicy = {
            // the maximum number of key-value pair
            max: 100,
            // each key-value ttl in mseconds
            maxAge: CACHE_TIMEOUT_IN_MSECOND
        };
        this.isActive = false;
        this.isGridResults = false;
        this.isSearching = false;
        this.currentQuery = null;
        this.userQueries = Cache(CachePolicy);
        this.channelQueries = Cache(CachePolicy);
    },

    getState: function() {
        var query = this.currentQuery;
        var channelResults = this.channelQueries.get(query);
        var userResults = this.userQueries.get(query);
        if (channelResults) {
            this.channelQueries.set(query, channelResults, CACHE_TIMEOUT_IN_MSECOND);
        }
        if (userResults) {
            this.userQueries.set(query, userResults, CACHE_TIMEOUT_IN_MSECOND);
        }
        return {
            isActive: this.isActive,
            isSearching: this.isSearching,
            isGridResults: this.isGridResults,
            results: {
                channels: channelResults || [],
                users: userResults || []
            }
        };
    }
});
