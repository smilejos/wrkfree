'use strict';
var CreateStore = require('fluxible/addons').createStore;

/**
 * stores for saving tourguide state
 */
module.exports = CreateStore({
    storeName: 'TourGuideStore',
    handlers: {
        'SET_TOURGUIDE_STATE': '_setState',
        'SET_DEFAULT_TOURGUIDE_STATE': '_setDefaultState',
        'HIDE_DEFAULT_TOURGUIDE_STATE': '_hideDefaultState'
    },

    initialize: function() {
        // to control tourguide is shown or not
        this.isShown = false;
        // to indicate user default login will hide tourguide or not
        this.isDefaultHidden = true;
    },

    /**
     * @Author: George_Chen
     * @Description: update the tourguide state
     *
     * @param {Boolean}      data.isShown, to indicate tour guide is shown or not
     */
    _setState: function(data) {
        this.isShown = data.isShown;
        this.emitChange();
    },

    /**
     * @Author: George_Chen
     * @Description: hide default tourguide state and shown state to hidden
     */
    _hideDefaultState: function() {
        this.isDefaultHidden = true;
        this.isShown = false;
        this.emitChange();
    },

    /**
     * @Author: George_Chen
     * @Description: set default tourguide state and shown state
     *
     * @param {Boolean}      data.isDefaultHidden, the default hidden state of tourguide 
     */
    _setDefaultState: function(data) {
        this.isDefaultHidden = data.isDefaultHidden;
        this.isShown = !data.isDefaultHidden;
        this.emitChange();
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: 
     */
    getState: function() {
        return {
            isShown: this.isShown,
            isDefaultHidden: this.isDefaultHidden
        };
    }
});
