'use strict';
var CreateStore = require('fluxible/addons').createStore;

// workspace bottom offset
var WORKSPACE_BOTTOM = 50;

// dashboard bottom offset
var NORMAL_BOTTOM = 5;

// rtc oncall timeout in millisecond
var ONCALL_CANCEL_TIMEOUT_IN_MSECOND = 3000;

module.exports = CreateStore({
    storeName: 'HangoutStore',

    handlers: {
        'ON_OPEN_HANGOUT': '_onOpenHangout',
        'CLOSE_OPEN_HANGOUT': '_closeHangout',
        'RESIZE_OPEN_HANGOUT': '_resizeHangout',
        'UPDATE_CONFERENCE': '_updateConference',
        'ON_CONFERENCE': '_onCall',
        'CHANGE_ROUTE': '_onChangeRoute',
        'UPDATE_HANGOUT_TWINKLE': '_updateHangoutTwinkle',
        'UPDATE_HANGOUT_FOCUS': '_updateHangoutFocus'
    },

    initialize: function() {
        this.hangouts = [];
        this.hangoutsInfo = {};
        this.bottomOffset = NORMAL_BOTTOM;
    },

    /**
     * @Author: George_Chen
     * @Description: handler for change hangout bottom offset based on current url
     *
     * @param {Object}     route, react route object
     */
    _onChangeRoute: function(route) {
        this.bottomOffset = (route.params.channelId ? WORKSPACE_BOTTOM : NORMAL_BOTTOM);
        this.emitChange();
    },

    /**
     * @Author: George_Chen
     * @Description: open current hangout window
     *
     * @param {String}     data.channelId, channel id
     */
    _onOpenHangout: function(data) {
        if (!this.isHangoutExist(data.channelId)) {
            this.hangouts.push(data.channelId);
            this.hangoutsInfo[data.channelId] = data;
            setImmediate(function(){
                this.emitChange();
            }.bind(this));
        }
    },

    /**
     * @Author: George_Chen
     * @Description: close current hangout window
     *
     * @param {String}     data.channelId, channel id
     */
    _closeHangout: function(data) {
        if (this.isHangoutExist(data.channelId)) {
            this.hangouts.splice(this.hangouts.indexOf(data.channelId), 1);
            delete this.hangoutsInfo[data.channelId];
            this.emitChange();
        }
    },

    /**
     * @Author: George_Chen
     * @Description: to handle hangout window resize
     *
     * @param {String}     data.channelId, channel id
     * @param {Boolean}     data.isCompressed, to hangout is resized to compressed or not
     */
    _resizeHangout: function(data) {
        if (this.isHangoutExist(data.channelId)) {
            this.hangoutsInfo[data.channelId].isCompressed = data.isCompressed;
            this.emitChange();
        }
    },

    /**
     * @Author: George_Chen
     * @Description: for updating twinkled state of current hangout
     *
     * @param {String}     data.channelId, channel id
     * @param {Boolean}    data.isTwinkled, indicate twinkled state of hangout
     */
    _updateHangoutTwinkle: function(data) {
        if (this.isHangoutExist(data.channelId)) {
            this.hangoutsInfo[data.channelId].isTwinkled = data.isTwinkled;
            this.emitChange();
        }
    },

    /**
     * @Author: George_Chen
     * @Description: for updating focused state of current hangout
     *
     * @param {String}     data.channelId, channel id
     * @param {Boolean}    data.onFocused, indicate focus hangout input or not
     */
    _updateHangoutFocus: function(data) {
        if (this.isHangoutExist(data.channelId)) {
            this.hangoutsInfo[data.channelId].onFocused = data.onFocused;
            this.emitChange();
        }
    },

    /**
     * @Author: George_Chen
     * @Description: to specify current conference call state on hangout
     *
     * @param {String}     data.channelId, channel id
     * @param {Boolean}    data.onConferenceCall, to indicate conference exist or not
     */
    _onCall: function(data) {
        var info = this.hangoutsInfo[data.channelId];
        var self = this;
        if (this.isHangoutExist(data.channelId)) {
            info.onCall = data.onConferenceCall;
            if (info.onCallTimeout) {
                clearTimeout(info.onCallTimeout);
            }
            info.onCallTimeout = setTimeout(function() {
                info.onCall = false;
                self.emitChange();
            }, ONCALL_CANCEL_TIMEOUT_IN_MSECOND);
            this.emitChange();
        }
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: to check target channel has open as hangout or not
     *
     * @param {String}      cid, channel id
     */
    isHangoutExist: function(cid) {
        return !!this.hangoutsInfo[cid];
    },

    getState: function() {
        return {
            hangouts: this.hangouts,
            hangoutsInfo: this.hangoutsInfo,
            bottomOffset: this.bottomOffset
        };
    }
});
