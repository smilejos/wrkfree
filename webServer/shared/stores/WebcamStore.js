'use strict';
var CreateStore = require('fluxible/addons').createStore;

/**
 * Webcam store used to keep the local webcam state
 */
module.exports = CreateStore({
    storeName: 'WebcamStore',

    handlers: {
        'CATCH_LOCAL_STREAM': '_catchLocalStream',
    },

    initialize: function() {
        this.isEnabled = false;
        this.stream = null;
        this.supportedMedia = {
            video: false,
            audio: false
        };
    },

    /**
     * @Author: George_Chen
     * @Description: 
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
            }
        }
        this.emitChange();
    },

    getState: function() {
        return {
            isEnabled: this.isEnabled,
            stream: this.stream,
            supportedMedia: this.supportedMedia
        };
    }
});
