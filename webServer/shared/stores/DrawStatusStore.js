'use strict';
var CreateStore = require('fluxible/addons').createStore;

/**
 * @Author: George_Chen
 * @Description: a tiny store for saving local user's drawing status
 */
module.exports = CreateStore({
    storeName: 'DrawStatusStore',

    handlers: {
        'ON_LOCAL_RECORD_SAVE': '_onSaved',
    },

    initialize: function() {
        this.isDrawSaved = false;
        this.defaultTimer = null;
    },

    /**
     * @Author: George_Chen
     * @Description: handling local draw saved event
     */
    _onSaved: function() {
        var self = this;
        self.isDrawSaved = true;
        clearTimeout(self.defaultTimer);
        self.defaultTimer = setTimeout(function() {
            self.isDrawSaved = false;
            self.emitChange();
        }, 500);
        self.emitChange();
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: for getting the current save status
     */
    getState: function() {
        return {
            isDrawSaved: this.isDrawSaved
        };
    }
});
