'use strict';
var CreateStore = require('fluxible/addons').createStore;
var SharedUtils = require('../../../sharedUtils/utils');
var DrawUtils = require('../../../sharedUtils/drawUtils');

module.exports = CreateStore({
    storeName: 'DrawTempStore',

    handlers: {
        'ON_DRAW_RECEIVE': 'onDrawReceive',
        'ON_DRAW_CHANGE': 'onDrawChange',
        'ON_RECORD_SAVE': '_onTempDrawClean',
        'ON_DRAW_INITED': '_onTempDrawClean',
        'CLEAN_FAILURE_DRAW': '_onTempDrawClean'
    },

    initialize: function() {
        this.tempDraws = {};
        this.tempDrawOptions = {};
        this.lastDraw = {};
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: handler for on draw change event
     *
     * @param {String}      data.channelId, target channel id
     * @param {Number}      data.boardId, target board id
     * @param {String}      data.clientId, the draw client sid
     * @param {Array}       data.chunks, the rawData of draw record
     * @param {Object}      data.drawOptions, the draw related options
     */
    onDrawChange: function(data) {
        var drawViewId = DrawUtils.getDrawViewId(data.channelId, data.boardId);
        this.lastDraw[drawViewId] = {
            chunks: data.chunks,
            drawOptions: data.drawOptions
        };
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
     * @param {String}      data.clientId, the draw client sid
     * @param {Array}       data.chunks, the rawData of draw record
     * @param {Object}      data.drawOptions, the draw related options
     */
    onDrawReceive: function(data) {
        this._onReceive(data);
    },

    /**
     * Public API
     * @Author: George_Chen
     * @Description: for cleaning temp draws
     *
     * @param {String}          data.channelId, the channel id
     * @param {Number}          data.boardId, the draw board id
     */
    _onTempDrawClean: function(data) {
        var drawViewId = DrawUtils.getDrawViewId(data.channelId, data.boardId);
        var tempDrawId = drawViewId + data.clientId;
        this.tempDraws[tempDrawId] = null;
        this.tempDrawOptions[tempDrawId] = null;
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
        return this.lastDraw[drawViewId];
    },

    /**
     * Public API
     * @Author: George_Chen
     * @Description: sugar syntax for getting local draws
     *
     * @param {String}          data.channelId, the channel id
     * @param {Number}          data.boardId, the draw board id
     */
    getLocalDraws: function(channelId, boardId) {
        return this.getDraws(channelId, boardId, 'local');
    },

    /**
     * Public API
     * @Author: George_Chen
     * @Description: to get all temp draws on current board
     *
     * @param {String}          data.channelId, the channel id
     * @param {Number}          data.boardId, the draw board id
     * @param {String}          data.clientId, the draw client id
     */
    getDraws: function(channelId, boardId, clientId) {
        var drawViewId = DrawUtils.getDrawViewId(channelId, boardId);
        var tempDrawId = drawViewId + clientId;
        return this.tempDraws[tempDrawId];
    },

    /**
     * @Author: George_Chen
     * @Description: save the received data to temp draw store
     *
     * @param {String}      data.channelId, target channel id
     * @param {Number}      data.boardId, target board id
     * @param {String}      data.clientId, the draw client id
     * @param {Array}       data.chunks, the rawData of draw record
     * @param {Object}      data.drawOptions, the draw related options
     */
    _onReceive: function(data) {
        var drawViewId = DrawUtils.getDrawViewId(data.channelId, data.boardId);
        var tempDrawId = drawViewId + data.clientId;
        if (!SharedUtils.isArray(this.tempDraws[tempDrawId])) {
            this.tempDraws[tempDrawId] = [];
        }
        this.tempDraws[tempDrawId].push(data.chunks);
        this.tempDrawOptions[tempDrawId] = data.drawOptions;
    }
});
