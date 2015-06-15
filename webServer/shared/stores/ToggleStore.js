'use strict';
var Promise = require('bluebird');
var CreateStore = require('fluxible/utils/createStore');

module.exports = CreateStore({
    storeName: 'ToggleStore',
    
    handlers: {
        'ON_TOGGLE_CHANGE': 'onToggleChange',
        'ON_CONFERENCE_START': '_onConferenceStart',
        'ON_CONFERENCE_END': '_onConferenceEnd',
    },

    initialize: function() {
        this.noticeVisiable = false;
        this.friendVisiable = false;
        this.conferenceVisible = false;
        this.discussionVisible = true;
    },

    getState: function() {
        return {
            noticeVisiable: this.noticeVisiable,
            friendVisiable: this.friendVisiable,
            conferenceVisible: this.conferenceVisible,
            discussionVisible: this.discussionVisible
        };
    },

    /**
     * @Author: George_Chen
     * @Description: for handling conference start
     */
    _onConferenceStart: function() {
        this.conferenceVisible = true;
        this.emitChange();
    },

    /**
     * @Author: George_Chen
     * @Description: for handling conference end
     */
    _onConferenceEnd: function() {
        this.conferenceVisible = false;
        this.emitChange();
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
