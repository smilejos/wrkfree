'use strict';
var Promise = require('bluebird');
var CreateStore = require('fluxible/utils/createStore');
var SharedUtils = require('../../../sharedUtils/utils');

/**
 * Default Draw Parameters
 */
var DRAW_MODE = 'pen';
var DRAW_PEN_LINECAP = 'round';
var DRAW_PEN_WIDTH = 10;
var DRAW_PEN_COLOR = '#000000';
var DRAW_PALETTE = false;

module.exports = CreateStore({
    storeName: 'WorkSpaceStore',
    handlers: {
        'ON_BOARD_ADD': 'onBoardAdd',
        'ON_DRAW_MODE_CHANGE': 'onDrawModeChange'
    },

    initialize: function() {
        this.channel = {};
        this.members = {};
        this.status = {};
        this.draw = {
            drawOptions: {
                mode: DRAW_MODE,
                lineCap: DRAW_PEN_LINECAP,
                lineWidth: DRAW_PEN_WIDTH,
                strokeStyle: DRAW_PEN_COLOR,
                palette: DRAW_PALETTE
            },
        };
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: set current board id to target board id
     *
     * @param {Number}      boardId, the target board id
     */
    setCurrentBoard: function(boardId) {
        this.draw.currentBoardId = boardId;
        this.emitChange();
    },

    /**
     * @Public API
     * @Author: Jos Tung
     * @Description: handler for drawing mode change
     *
     * @param {drawOptions}  drawOptions = { mode, lineCap, lineWidth, strokeStyle }
     */
    onDrawModeChange: function(data) {
        for( var prop in data) {
            this.draw.drawOptions[prop] = data[prop];
        }
        this.emitChange();
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: handler for new board added event
     *
     * @param {Number}      boardId, the new board id
     * @param {Boolean}     toNewBoard, to indicate currentBoard id should
     *                                 be set or not
     */
    onBoardAdd: function(data) {
        this.draw.boardNums = data.boardId + 1;
        if (data.toNewBoard) {
            this.draw.currentBoardId = data.boardId;
        }
        this.emitChange();
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: polyfill the state of current store
     *
     * @param {Object}      state, the state of workSpace store
     */
    polyfillAsync: function(state) {
        var self = this;
        return Promise.try(function() {
            self.channel = state.channel.basicInfo;
            self.members = state.members;
            self.draw.boardNums = state.channel.drawBoardNums;
            self.status = state.status;
        }).then(function() {
            self.emitChange();
        }).catch(function(err) {
            SharedUtils.printError('WorkSpaceStore.js', 'polyfillAsync', err);
        });
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: used to check current store is polyfilled or not
     *
     * @param {String}      channelId, channel's id
     */
    isPolyFilled: function(channelId) {
        return (this.channel.channelId === channelId);
    },

    getState: function() {
        return {
            channel: this.channel,
            members: this.members,
            draw: this.draw,
            status: this.status
        };
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: dehydrate mechanism will be called by fluxible framework
     */
    dehydrate: function() {
        return this.getState();
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: rehydrate mechanism will be called by fluxible framework
     *
     * @param {String}      state, the stringify state returned by "dehydrate"
     */
    rehydrate: function(state) {
        this.channel = state.channel;
        this.members = state.members;
        this.draw = state.draw;
        this.status = state.status;
    }
});
