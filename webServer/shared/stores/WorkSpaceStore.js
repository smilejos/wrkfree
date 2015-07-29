'use strict';
var Promise = require('bluebird');
var CreateStore = require('fluxible/addons').createStore;
var SharedUtils = require('../../../sharedUtils/utils');

/**
 * Default Parameters
 */
var Configs = require('../../../configs/config');
var DrawOptions = Configs.get().params.draw.drawOptions;
if (!DrawOptions) {
    throw new Error('get draw parameters error');
}

var RTC_CANCEL_TIMEOUT_IN_MSECOND = Configs.get().params.rtc.sessionCancelInMScend;
if (!SharedUtils.isNumber(RTC_CANCEL_TIMEOUT_IN_MSECOND)) {
    throw new Error('get rtc parameters error');
}

module.exports = CreateStore({
    storeName: 'WorkSpaceStore',
    handlers: {
        'ON_BOARD_ADD': 'onBoardAdd',
        'ON_DRAW_MODE_CHANGE': 'onDrawModeChange',
        'ON_CONFERENCE': '_onConference',
        'CHANGE_ROUTE': '_onChangeRoute',
        'UPDATE_CHANNEL_STAR': '_updateChannelStar'
    },

    /**
     * @Author: George_Chen
     * @Description: to update starred status of workspace channel
     *
     * @param {String}      data.channelId, the channel id
     * @param {String}      data.toStar, current channel starred staus
     */
    _updateChannelStar: function(data) {
        if (data.channelId === this.channel.channelId) {
            this.status.isStarred = data.toStar;
            this.emitChange();
        }
    },

    /**
     * @Author: George_Chen
     * @Description: to clean store when user not route to "/app/workspace"
     *
     * @param {Object}      route, the react-router object
     */
    _onChangeRoute: function(route) {
        if (!route.params.channelId) {
            this.initialize();
        }
    },

    /**
     * @Author: George_Chen
     * @Description: to check current channel id has been opened as workspace or not
     *
     * @param {String}      cid, the channel id
     */
    isOpenedChannel: function(cid) {
        return (this.channel.channelId === cid);
    },

    initialize: function() {
        this.channel = {};
        this.members = {};
        this.status = {};
        this.draw = {
            drawOptions: DrawOptions
        };
        this.rtc = {
            onConferenceCall: false
        };
        this.rtcTimeout = null;
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
        for (var prop in data) {
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
        this.emitChange();
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: to specify current conference call state
     *
     * @param {Boolean}     onConferenceCall, to indicate conference exist or not
     */
    _onConference: function(data) {
        var self = this;
        if (data.channelId === this.channel.channelId) {
            this.rtc.onConferenceCall = data.onConferenceCall;
            if (this.rtcTimeout) {
                clearTimeout(this.rtcTimeout);
            }
            this.rtcTimeout = setTimeout(function() {
                self.rtc.onConferenceCall = false;
                self.emitChange();
            }, RTC_CANCEL_TIMEOUT_IN_MSECOND);
            this.emitChange();
        }
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
            var membersInfo = self.members.info;
            var selfUid = self.status.member;
            if (self.channel.is1on1) {
                SharedUtils.fastArrayMap(membersInfo, function(info){
                    if (info.uid !== selfUid) {
                        self.channel.name = info.nickName;
                    }
                });
            }
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
        var state = {
            channel: this.channel,
            members: this.members,
            rtc: this.rtc,
            draw: this.draw,
            status: this.status
        };
        return state;
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
