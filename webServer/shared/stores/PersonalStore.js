'use strict';
var CreateStore = require('fluxible/addons').createStore;

module.exports = CreateStore({
    storeName: 'PersonalStore',
    handlers: {
        'TOGGLE_PERSONALINFO': '_togglePersonalInfo',
        'TOGGLE_SUBSCRIPTIONLIST': '_deactivePersonalInfo',
        'TOGGLE_FRIENDLIST': '_deactivePersonalInfo',
        'TOGGLE_CHANNELCREATOR': '_deactivePersonalInfo',
        'TOGGLE_QUICKSEARCH': '_deactivePersonalInfo',
        'TOGGLE_NOTIFICATION': '_deactivePersonalInfo',
        'TOGGLE_MAIN_VIEWPOINT': '_deactivePersonalInfo'
    },


    initialize: function() {
        this.isActive = false;
    },

    getState: function() {
        return {
            isActive: this.isActive
        };
    },

    /**
     * @Author: George_Chen
     * @Description: to toggle the active status of personal info
     *
     * @param {Boolean}          data.isActive, indicate is active or not
     */
    _togglePersonalInfo: function(data) {
        this.isActive = data.isActive;
        this.emitChange();
    },

    /**
     * @Author: George_Chen
     * @Description: to deactive personal info status
     *         NOTE: when other component is active, then deactive current component
     *
     * @param {Boolean}          data.isActive, indicate other component is active or not
     */
    _deactivePersonalInfo: function(data) {
        if (data.isActive && this.isActive) {
            this.isActive = false;
            this.emitChange();
        }
    }
});
