var React = require('react');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');

/**
 * actions
 */
var OpenHangout = require('../../../client/actions/openHangout');
var Update1on1ChannelId = require('../../../client/actions/friend/Update1on1ChannelId');

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
     * @Description: to setup the unread message icon style
     */
    _setUnreadMessageIcon: function() {
        var isReaded = this.props.info.isMessageReaded;
        var iconClass = 'unreadMessageIcon fa fa-envelope ';
        iconClass = (isReaded ? iconClass + 'hide' : iconClass + 'show');
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
        this.executeAction(Update1on1ChannelId, {
            friendUid: this.props.info.uid
        });
    },

    render: function(){
        var info = this.props.info;
        var stateColor = (info.isOnline ? "onlineState" : "offlineState");
        var timeClass = (this.props.timeVisible ? 'conversationTime show' : 'conversationTime hide');
        var FriendClass = (info.isMessageReaded ? 'Friend' : 'Friend hasUnreadMessage' );
        return (
            <div className={FriendClass} >
                <div className="friendAvatar">
                    <UserAvatar avatar={info.avatar} isCircle />
                    <span className= {stateColor}></span>
                    {this._setUnreadMessageIcon()}
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
