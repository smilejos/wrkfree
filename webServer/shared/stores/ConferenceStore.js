'use strict';
var CreateStore = require('fluxible/addons').createStore;

/**
 * conference store used to track conference state
 * 
 * NOTE: each conference state include remote client's socketId and stream
 */
module.exports = CreateStore({
    storeName: 'ConferenceStore',

    handlers: {
        'ON_CONFERENCE_START': '_onConferenceStart',
        'ON_CONFERENCE_END': '_onConferenceEnd',
        'CATCH_REMOTE_STREAM': '_catchRemoteStream',
    },

    initialize: function() {
        this.conferences = {};
    },

    /**
     * @Author: George_Chen
     * @Description: handler for channel conference start
     *
     * @param {String}          data.channelId, the channel id
     */
    _onConferenceStart: function(data) {
        this.conferences[data.channelId] = {};
        this.emitChange();
    },

    /**
     * @Author: George_Chen
     * @Description: handler for channel conference end
     *
     * @param {String}          data.channelId, the channel id
     */
    _onConferenceEnd: function(data) {
        delete this.conferences[data.channelId];
        this.emitChange();
    },

    /**
     * @Author: George_Chen
     * @Description: handler for catching remote rtc media stream 
     *
     * @param {String}          data.channelId, the channel id
     * @param {String}          data.clientId, the remote client socket
     * @param {Object}          data.stream, the remote media stream
     */
    _catchRemoteStream: function(data) {
        if (!this.conferences[data.channelId]) {
            this.conferences[data.channelId] = {};
        }
        if (!data.stream && this.conferences[data.channelId][data.clientId]) {
            delete this.conferences[data.channelId][data.clientId];
        } else {
            this.conferences[data.channelId][data.clientId] = data.stream;
        }
        this.emitChange();
    },

    /**
     * Public API
     * @Author: George_Chen
     * @Description: check specific channel conference is exist or not
     *
     * @param {String}          data.channelId, the channel id
     */
    isExist: function(channelId) {
        return !!this.conferences[channelId];
    },

    /**
     * Public API
     * @Author: George_Chen
     * @Description: check user has conference.
     */
    hasConference: function() {
        return (Object.keys(this.conferences).length > 0);
    },

    /**
     * Public API
     * @Author: George_Chen
     * @Description: get the conference state on current channel
     * 
     * @param {String}          data.channelId, the channel id
     */
    getState: function(channelId) {
        return {
            conference: this.conferences[channelId],
        };
    }
});
