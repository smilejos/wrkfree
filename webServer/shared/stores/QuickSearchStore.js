'use strict';
var CreateStore = require('fluxible/utils/createStore');

module.exports = CreateStore({
    storeName: 'QuickSearchStore',

    handlers: {
        'ON_QUICKSEARCH_UPDATE': 'onQuickSearchUpdate',
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

    /**
     * @Author: George_Chen
     * @Description: update the search results
     *
     * @param {Array}          data.channels, the search results of channels
     * @param {Array}          data.users, the search results of users
     */
    onQuickSearchUpdate: function(data) {
        if (data.channels) {
            this.results.channels = data.channels;
        }
        if (data.users) {
            this.results.users = data.users;
        }
        this.emitChange();
    },

    initialize: function() {
        this.isEnabled = false;
        this.queryStr = null;
        this.results = {
            channels: [],
            users: []
        };
    },

    getState: function() {
        return {
            isEnabled: this.isEnabled,
            queryStr: this.queryStr,
            results: this.results
        };
    }
});
