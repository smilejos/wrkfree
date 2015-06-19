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
    },

    /**
     * @Author: George_Chen
     * @Description: 
     *
     * @param {Boolean}         data.isEnabled, to control webcam div shown or not
     * @param {Object}          data.mediaStream, the media stream instance
     */
    _catchLocalStream: function(data) {
        this.stream = data.mediaStream;
        this.isEnabled = data.isEnabled;
        this.emitChange();
    },

    getState: function() {
        return {
            isEnabled: this.isEnabled,
            stream: this.stream
        };
    }
});
