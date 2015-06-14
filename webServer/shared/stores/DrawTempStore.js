'use strict';
var CreateStore = require('fluxible/addons').createStore;
var SharedUtils = require('../../../sharedUtils/utils');
var DrawUtils = require('../../../sharedUtils/drawUtils');

module.exports = CreateStore({
    storeName: 'DrawTempStore',

    handlers: {
        'ON_DRAW_RECEIVE': 'onDrawReceive',
        'ON_DRAW_CHANGE': 'onDrawChange',
        'ON_RECORD_SAVE': 'onRecordSave'
    },

    initialize: function() {
        this.tempDraws = {};
        this.tempDrawOptions = {};
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: handler for on draw change event
     *
     * @param {String}      data.channelId, target channel id
     * @param {Number}      data.boardId, target board id
     * @param {Array}       data.chunks, the rawData of draw record
     * @param {Object}      data.drawOptions, the draw related options
     */
    onDrawChange: function(data) {
        this._onReceive(data);
        this.emitChange();
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: handler for on draw receive event
     *         NOTE: we did not trigger this.emitChange() here
     *              because the receive is trigger by different board
     *
     * @param {String}      data.channelId, target channel id
     * @param {Number}      data.boardId, target board id
     * @param {Array}       data.chunks, the rawData of draw record
     * @param {Object}      data.drawOptions, the draw related options
     */
    onDrawReceive: function(data) {
        this._onReceive(data);
    },

    /**
     * Public API
     * @Author: George_Chen
     * @Description: for handling new draw record save event
     *
     * @param {String}          data.channelId, the channel id
     * @param {Number}          data.boardId, the draw board id
     */
    onRecordSave: function(data) {
        var drawViewId = DrawUtils.getDrawViewId(data.channelId, data.boardId);
        this.tempDraws[drawViewId] = null;
        this.tempDrawOptions[drawViewId] = null;
    },

    /**
     * Public API
     * @Author: George_Chen
     * @Description: for component to get the latest temp draw chunks
     *
     * @param {String}          data.channelId, the channel id
     * @param {Number}          data.boardId, the draw board id
     */
    getLastDraw: function(channelId, boardId) {
        var drawViewId = DrawUtils.getDrawViewId(channelId, boardId);
        var index = this.tempDraws[drawViewId].length - 1;
        return {
            chunks: this.tempDraws[drawViewId][index],
            drawOptions: this.tempDrawOptions[drawViewId]
        };
    },

    /**
     * Public API
     * @Author: George_Chen
     * @Description: to get all temp draws on current board
     *
     * @param {String}          data.channelId, the channel id
     * @param {Number}          data.boardId, the draw board id
     */
    getDraws: function(channelId, boardId) {
        var drawViewId = DrawUtils.getDrawViewId(channelId, boardId);
        return this.tempDraws[drawViewId];
    },

    /**
     * @Author: George_Chen
     * @Description: save the received data to temp draw store
     *
     * @param {String}      data.channelId, target channel id
     * @param {Number}      data.boardId, target board id
     * @param {Array}       data.chunks, the rawData of draw record
     * @param {Object}      data.drawOptions, the draw related options
     */
    _onReceive: function(data) {
        var drawViewId = DrawUtils.getDrawViewId(data.channelId, data.boardId);
        if (!SharedUtils.isArray(this.tempDraws[drawViewId])) {
            this.tempDraws[drawViewId] = [];
        }
        this.tempDraws[drawViewId].push(data.chunks);
        this.tempDrawOptions[drawViewId] = data.drawOptions;
    }
});
