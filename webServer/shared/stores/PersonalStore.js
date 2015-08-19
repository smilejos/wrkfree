'use strict';
var CreateStore = require('fluxible/addons').createStore;
var SharedUtils = require('../../../sharedUtils/utils');
var Promise = require('bluebird');

module.exports = CreateStore({
    storeName: 'PersonalStore',

    initialize: function() {
        this.isActive = false;
    },

    getState: function() {
        return {
            isActive: this.isActive
        };
    },

    /**
     * Public API
     * @Author: Jos Tung
     * @Description: used to show or hide PersonalInfo
     * NOTE: if is "isOpen" is invalid, we will change "actived" state different from current
     * 
     * @param {Boolean}        isOpen, to indicate channelNav bar should open or not
     */
    toggleAsync: function(isOpen) {
        var self = this;
        return Promise.try(function() {
            self.isActive = (SharedUtils.isBoolean(isOpen) ? isOpen : !self.isActive);
            self.emitChange();
        });
    }
});
