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
     *
     * @param data = { paramters, isVisible }
     */
    onToggleChange: function(data){
        if( data.isVisible ) {
            this[data.para] = data.isVisible;    
        } else {
            this[data.para] = !this[data.para];
        }
        
        console.log("onToggleChange", data);
        this.emitChange();
    },

    /**
     * @Public API
     * @Author: Jos Tung
     * @Description: set notification visiable or not
     *
     * @param {boolen}    visible or not
     */
    onNoticeVisible: function(isVisible) {
        this.isNoticeVisible = isVisible;
        this.emitChange();
    },

    /**
     * @Public API
     * @Author: Jos Tung
     * @Description: set friend list visiable or not
     *
     * @param {boolen}    visible or not
     */
    onFriendListVisible: function(isVisible) {
        this.isFriendListVisible = isVisible;
        this.emitChange();
    }
});
