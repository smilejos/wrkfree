'use strict';
var CreateStore = require('fluxible/addons').createStore;

/**
 * preview store used to track remote board preview updaetd time
 */
module.exports = CreateStore({
    storeName: 'PreviewStore',

    handlers: {
        'ON_PREVIEW_UPDATED': '_onPreviewUpdated',
    },

    initialize: function() {
        this.previewImgs = {};
    },

    /**
     * @Author: George_Chen
     * @Description: update board preview updatedTime
     *         NOTE: update both on channel and board
     */
    _onPreviewUpdated: function(data) {
        var cid = data.channelId;
        var bid = data.boardId;
        var updatedData = {
            remoteUpdatedTime: Date.now()
        };
        this.previewImgs[cid] = updatedData;
        this.previewImgs[cid + bid] = updatedData;
        this.emitChange();
    },

    /**
     * @Author: George_Chen
     * @Description: get preview latest udpatedTime on channel
     */
    getByChannel: function(channelId) {
        return this.previewImgs[channelId];
    },

    /**
     * @Author: George_Chen
     * @Description: get preview latest udpatedTime on board
     */
    getByBoard: function(channelId, boardId) {
        return this.previewImgs[channelId + boardId];
    }
});
