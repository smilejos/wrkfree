var React = require('react');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');
var SharedUtils = require('../../../../sharedUtils/utils');

/**
 * actions
 */
var OpenHangout = require('../../../client/actions/openHangout');
var Update1on1ChannelId = require('../../../client/actions/friend/update1on1ChannelId');
var StartConference = require('../../../client/actions/rtc/startConference');
var SetConferenceEvent = require('../../../client/actions/rtc/setConferenceEvent');
var SubscribeChannelNotification = require('../../../client/actions/channel/subscribeChannelNotification');
var TrackFriendActivity = require('../../../client/actions/friend/trackFriendActivity');
var TrackFriendSession = require('../../../client/actions/friend/trackFriendSession');

/**
 * load configs
 */
var Configs = require('../../../../configs/config');
var CALL_DISSMISS_TIME_IN_MSECOND = Configs.get().params.rtc.sessionTimeoutInSecond * 1000;

/**
 * child components
 */
var UserAvatar = require('./userAvatar.jsx');

/**
 * @Author: George_Chen
 * @Description: an Friend component to display each user's friend
 * 
 * @param {String}      this.props.self, self uid
 * @param {Boolean}     this.props.timeVisible, indicate to show time or not
 * @param {Boolean}     this.props.isMessageReaded, indicate has unread message or not
 * @param {String}      this.props.info.avatar, the friend's avatar
 * @param {String}      this.props.info.nickName, the friend's nickName
 * @param {String}      this.props.info.uid, friend's uid
 * @param {String}      this.props.info.channelId, 1on1 channelId with current friend
 * @param {String}      this.props.info.group, an friend group name
 * @param {Boolean}     this.props.info.isOnline, status about user online or not
 */
module.exports = React.createClass({
    mixins: [FluxibleMixin],

    /**
     * @Author: George_Chen
     * @Description: handler for opening 1on1 hangout
     */
    _openHangout: function() {
        var info = this.props.info;
        this.executeAction(OpenHangout, {
            channelId: this.props.info.channelId,
            hangoutTitle: info.nickName
        });
    },

    /**
     * @Author: George_Chen
     * @Description: to get fromatted time string by lastMessage sentTime
     */
    _getFormattedTime: function() {
        if (!this.props.info.lastMessage.sentTime) {
            return '';
        }
        var date = new Date(this.props.info.lastMessage.sentTime);
        return date.toLocaleDateString();
    },

    /**
     * @Author: George_Chen
     * @Description: to setup the user state icon style
     */
    _setStateIcon: function() {
        var isReaded = this.props.info.isMessageReaded;
        var hasIncomingCall = this.props.hasIncomingCall;
        var iconClass = '';
        if (hasIncomingCall) {
            iconClass = 'unreadMessageIcon fa fa-phone show';
        } else if (!this.props.info.isMessageReaded) {
            iconClass = 'unreadMessageIcon fa fa-envelope show';
        }
        return <span className={iconClass}></span>
    },

    /**
     * @Author: George_Chen
     * @Description: to set the last message view
     */
    _setLastMessage: function() {
        var info = this.props.info;
        if (!info.lastMessage.message) {
            return (
                <div className="lastMessage">
                    <span className="noMessage" >{"Talk Now!-"} </span>
                    <span className="fa fa-paper-plane-o"/>
                </div>
            );
        }
        return (
            <div className="lastMessage">
                <span className="sender">{info.lastMessage.from === this.props.self ? 'Me :' : ''} </span>
                <span className="content">{info.lastMessage.message} </span>
            </div>
        );
    },

    getInitialState: function() {
        return {
            isTimeVisible: false
        };
    },

    /**
     * @Author: George_Chen
     * @Description: update 1on1 channel id for each friend item
     *         NOTE: only update each item has been mounted
     */
    componentDidMount: function() {
        var context = window.context;
        var info = this.props.info;
        var self = this;
        var reqData = {
            friendUid: info.uid,
            channelId: SharedUtils.get1on1ChannelId(this.props.self, info.uid)
        };
        return context.executeAction(Update1on1ChannelId, reqData)
            .then(function(){
                context.executeAction(TrackFriendActivity, reqData)
            }).then(function(){
                context.executeAction(SubscribeChannelNotification, reqData)
            }).then(function(){
                if (self.props.info.isOnline) {
                    self.executeAction(TrackFriendSession, {
                        uid: info.uid
                    });
                }
            });
    },

    componentWillUnmount: function() {
        // TODO: when delete friend, we should untrack and unsubscribe him/her
    },

    componentWillReceiveProps: function(nextProps) {
        var self = this;
        if (nextProps.hasIncomingCall !== this.props.hasIncomingCall) {
            self.executeAction(SetConferenceEvent, {
                channelId: nextProps.info.channelId,
                isShown: nextProps.hasIncomingCall,
                ttl: CALL_DISSMISS_TIME_IN_MSECOND,
                title: 'Incoming Call',
                message: 'From ['+this.props.info.nickName + ']',
                callHandler: function() {
                    self._openHangout();
                    setTimeout(function(){
                        self.executeAction(StartConference, {
                            channelId: nextProps.info.channelId
                        });
                    }, 1000);
                }
            });
        }
    },

    render: function(){
        var info = this.props.info;
        var stateColor = (info.isOnline ? "onlineState" : "offlineState");
        var timeClass = (this.props.timeVisible ? 'conversationTime show' : 'conversationTime hide');
        var FriendClass = 'Friend';
        if (info.hasIncomingCall) {
            FriendClass = FriendClass + ' hasIncomingCall';
        } else if (!info.isMessageReaded) {
            FriendClass = FriendClass + ' hasUnreadMessage';
        }
        return (
            <div className={FriendClass} >
                <div className="friendAvatar">
                    <UserAvatar avatar={info.avatar} isCircle />
                    <span className= {stateColor}></span>
                    {this._setStateIcon()}
                </div>
                <div className="friendInfo" onClick={this._openHangout}>
                    <div className="friendName">
                        {info.nickName}
                    </div>
                    {this._setLastMessage()}
                    <div className={timeClass}>
                        {this._getFormattedTime()}
                    </div>
                </div>
            </div>
        );
    }
});
