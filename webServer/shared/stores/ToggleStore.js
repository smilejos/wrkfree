'use strict';
var Promise = require('bluebird');
var CreateStore = require('fluxible/utils/createStore');

module.exports = CreateStore({
    storeName: 'ToggleStore',
    
    handlers: {
        'ON_TOGGLE_CHANGE': 'onToggleChange'
    },

    initialize: function() {
        this.noticeVisiable = false;
        this.friendVisiable = false;
    },

    getState: function() {
        return {
            noticeVisiable: this.noticeVisiable,
            friendVisiable: this.friendVisiable
        };
    },

    /**
     * @Public API
     * @Author: Jos Tung
     * @Description: set notification visiable or not
     * NOTE: 
     *
     * @param {String}       data.param, the parameter name of toggle component
     * @param {Boolean}      data.isVisible, indicate component is visible or not
     */
    onToggleChange: function(data){
        this[data.param] = (data.isVisible ? data.isVisible : !this[data.param])
        this.emitChange();
    },
});
