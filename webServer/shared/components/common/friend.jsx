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
 * stores
 */
var WorkSpaceStore = require('../../stores/WorkSpaceStore');

/**
 * load configs
 */
var Configs = require('../../../../configs/config');
var CALL_DISSMISS_TIME_IN_MSECOND = Configs.get().params.rtc.sessionTimeoutInSecond * 1000;

/**
 * material-ui components
 */
var Mui = require('material-ui');
var List = Mui.List;
var ListItem = Mui.ListItem;
var ListDivider = Mui.ListDivider;
var FontIcon = Mui.FontIcon;
var Avatar = Mui.Avatar;
var Colors = Mui.Styles.Colors;

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
            hangoutTitle: info.nickName,
            isforcedToOpen: false
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
     * @Description: to set the last message view
     */
    _setLastMessage: function() {
        var info = this.props.info;
        var containerStyle = {
            overflow: 'hidden', 
            marginLeft: -10,
            fontSize: 13
        };
        var prefixTextStyle = {
            fontWeight: 400,
            color: '#27A'
        };
        if (!info.lastMessage.message) {
            return (
                <div style={containerStyle} >
                    <span style={prefixTextStyle} >{"Talk Now!-"} </span>
                </div>
            );
        }
        return (
            <div style={containerStyle} >
                <span style={prefixTextStyle}>{info.lastMessage.from === this.props.self ? 'Me :' : ''} </span>
                <span>{info.lastMessage.message}</span>
            </div>
        );
    },

    /**
     * @Author: George_Chen
     * @Description: used to set channel left icon
     */
    _setLeftAvatar: function() {
        var isOnline = this.props.info.isOnline;
        return (
            <div style={{marginTop: -5}}>
                <Avatar size={10} 
                    backgroundColor={isOnline ? Colors.green500 : Colors.grey400}
                    style={{position: 'absolute', bottom: 0, right: 0}} />
                <Avatar src={this.props.info.avatar} />
            </div>
        );
    },

    /**
     * @Author: George_Chen
     * @Description: used to set channel right icon
     */
    _setRightIcon: function() {
        var iconColor = '#27A';
        var iconAction = 'textsms';
        var timeStyle = {
            position: 'absolute',
            opacity: this.props.timeVisible ? 1 : 0,
            top: 40,
            right: -10,
            fontSize: 9,
            transition: '0.5s',
            color: Colors.grey700
        };
        if (!this.props.info.isMessageReaded) {
            iconColor = Colors.green500;
            iconAction = 'chat';
        }
        if (this.props.hasIncomingCall) {
            iconColor = Colors.green500;
            iconAction = 'phone_in_talk';
        }
        return (
            <div style={{marginTop: -9, marginRight: 15}}>
                <FontIcon className="material-icons" color={iconColor}>
                    {iconAction}
                </FontIcon>
                <div style={timeStyle}>
                    {this._getFormattedTime()}
                </div>
            </div>
        );
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
                    var cid = nextProps.info.channelId;
                    if (!self.getStore(WorkSpaceStore).isOpenedChannel(cid)) {
                        self._openHangout();
                    }
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
        var hasCall = this.props.hasIncomingCall;
        var nameStyle = {
            overflow: 'hidden', 
            marginLeft: -10,
            marginTop: -10,
            fontSize: 13,
            fontWeight: 500
        };
        var itemStyle = {
            height: 60
        };
        if (!info.isMessageReaded || hasCall) {
            itemStyle.backgroundColor = Colors.grey100;
        }
        return (
            <div className={hasCall ? 'hasIncomingCall' : ''} >
                <ListItem 
                    onTouchTap={this._openHangout}
                    style={itemStyle}
                    primaryText={<div style={nameStyle}>{info.nickName}</div>} 
                    secondaryText={this._setLastMessage()} 
                    leftAvatar={this._setLeftAvatar()}
                    rightIcon={this._setRightIcon()} />
                <ListDivider inset />
            </div>
        );
    }
});
