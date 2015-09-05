'use strict';
var CreateStore = require('fluxible/addons').createStore;
var DrawUtils = require('../../../sharedUtils/drawUtils');
var Cache = require('lru-cache');
var Deque = require('double-ended-queue');

var DRAW_TEMP_TIMEOUT = 2000;
var DEFAULT_TEMP_DRAWS_LENGTH = 200;

module.exports = CreateStore({
    storeName: 'DrawTempStore',

    handlers: {
        'ON_DRAW_RECEIVE': '_onDrawReceive',
        'ON_RECORD_SAVE': '_onRecordSave',
        'ON_DRAW_INITED': '_onTempDrawClean',
        'CLEAN_FAILURE_DRAW': '_onTempDrawClean',
        'CLEAN_LOCAL_DRAW': 'cleanLocalTemp'
    },

    initialize: function() {
        var cachePolicy = {
            maxAge: DRAW_TEMP_TIMEOUT
        };
        this.tempDraws = Cache();
        this.tempDrawOptions = Cache(cachePolicy);
        this.lastDraw = Cache(cachePolicy);
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
    saveDrawChange: function(data) {
        var drawViewId = DrawUtils.getDrawViewId(data.channelId, data.boardId);
        this.lastDraw.set(drawViewId, {
            chunks: data.chunks,
            drawOptions: data.drawOptions
        }, DRAW_TEMP_TIMEOUT);
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
    _onDrawReceive: function(data) {
        this._onReceive(data);
    },

    /**
     * Public API
     * @Author: George_Chen
     * @Description: for cleaning temp draws
     *
     * @param {String}          data.channelId, the channel id
     * @param {Number}          data.boardId, the draw board id
     * @param {String}          data.clientId, the draw client id
     */
    _onTempDrawClean: function(data) {
        var drawId = _getTempClientId(data.channelId, data.boardId, data.clientId);
        var draws = this.tempDraws.get(drawId);
        if (draws) {
            draws.clear();
        }
        this.tempDrawOptions.del(drawId);
    },

    _onRecordSave: function(data) {
        if (data.clientId !== 'local') {
            this._onTempDrawClean(data);
        }
    },

    /**
     * Public API
     * @Author: George_Chen
     * @Description: for clean local temp draws
     *
     * @param {String}          data.channelId, the channel id
     * @param {Number}          data.boardId, the draw board id
     */
    cleanLocalTemp: function(data) {
        this._onTempDrawClean({
            channelId: data.channelId,
            boardId: data.boardId,
            clientId: 'local'
        });
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
        return this.lastDraw.get(drawViewId);
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
        var drawId = _getTempClientId(channelId, boardId, clientId);
        var draws = this.tempDraws.get(drawId);
        return (draws ? draws.toArray() : []);
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
        var drawId = _getTempClientId(data.channelId, data.boardId, data.clientId);
        var draws = null;
        if (!this.tempDraws.has(drawId)) {
            draws = new Deque(DEFAULT_TEMP_DRAWS_LENGTH);
            this.tempDraws.set(drawId, draws);
        } else {
            draws = this.tempDraws.get(drawId);
        }
        draws.push(data.chunks);
        this.tempDrawOptions.set(drawId, data.drawOptions, DRAW_TEMP_TIMEOUT);
    }
});

/**
 * @Author: George_Chen
 * @Description: to generate a temp client id
 *
 * @param {String}      cid, target channel id
 * @param {Number}      bid, target board id
 * @param {String}      client, the draw client id
 */
function _getTempClientId(cid, bid, client) {
    return (cid + bid + client);
}
