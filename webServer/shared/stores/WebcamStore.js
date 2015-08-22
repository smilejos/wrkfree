'use strict';
var CreateStore = require('fluxible/addons').createStore;

/**
 * Webcam store used to keep the local webcam state
 */
module.exports = CreateStore({
    storeName: 'WebcamStore',

    handlers: {
        'CATCH_LOCAL_STREAM': '_catchLocalStream',
        'CREATE_STREAM_STATE': '_createStreamState',
        'UPDATE_STREAM_STATE': '_updateStreamState',
        'CLEAN_STREAM_STATE': '_cleanStreamState'
    },

    initialize: function() {
        this.isEnabled = false;
        this.stream = null;
        this.supportedMedia = {
            video: false,
            audio: false
        };
        this.streamStates = {};
    },

    /**
     * @Author: George_Chen
     * @Description: clean current webcam stream state settings
     *
     * @param {String}         channelId, the channel id
     */
    _cleanStreamState: function(data) {
        delete this.streamStates[data.channelId];
    },

    /**
     * @Author: George_Chen
     * @Description: setup channel dependent stream state
     *
     * @param {String}         data.channelId, the channel id
     */
    _createStreamState: function(data) {
        this.streamStates[data.channelId] = this._getDefaultStreamState();
        this.isEnabled = true;
        this.emitChange();
    },

    /**
     * @Author: George_Chen
     * @Description: get the default webcam stream settings
     */
    _getDefaultStreamState: function() {
        return {
            isVideoOn: true,
            isAudioOn: true
        };
    },

    /**
     * @Author: George_Chen
     * @Description: get webcam stream state based on current channel
     *
     * @param {String}         channelId, the channel id
     * @param {Boolean}        isVideo, indicate is video mode
     * @param {Boolean}        isOn, indicate is trun-on or turn-off
     */
    _updateStreamState: function(data) {
        var stream = this.streamStates[data.channelId];
        if (data.isVideo) {
            stream.isVideoOn = data.isOn;
        } else {
            stream.isAudioOn = data.isOn;
        }
        this.emitChange();
    },

    /**
     * @Author: George_Chen
     * @Description: catch local stream and update on store
     *
     * @param {Boolean}         data.isEnabled, to control webcam div shown or not
     * @param {Object}          data.mediaStream, the media stream instance
     */
    _catchLocalStream: function(data) {
        if (!data.mediaStream) {
            this.initialize();
        } else {
            this.stream = data.mediaStream;
            this.isEnabled = data.isEnabled;
            this.supportedMedia = {
                video: (this.stream.getVideoTracks().length > 0),
                audio: (this.stream.getAudioTracks().length > 0)
            };
        }
        this.emitChange();
    },

    /**
     * Public API
     * @Author: George_Chen
     * @Description: check webcam stream has setup or not
     */
    hasLocalStream: function() {
        return !!this.stream;
    },

    /**
     * @Author: George_Chen
     * @Description: get webcam stream state based on current channel
     *
     * @param {String}         channelId, the channel id
     */
    getStreamState: function(channelId) {
        var streamState = this.streamStates[channelId];
        return (streamState ? streamState : this._getDefaultStreamState());
    },

    getState: function() {
        return {
            isEnabled: this.isEnabled,
            stream: this.stream,
            supportedMedia: this.supportedMedia
        };
    }
});
