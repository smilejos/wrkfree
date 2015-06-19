var React = require('react');
var UserAvatar = require('./userAvatar.jsx');
var FluxibleMixin = require('fluxible/addons/FluxibleMixin');
var SharedUtils = require('../../../../sharedUtils/utils');
var OpenHangout = require('../../../client/actions/openHangout');

/**
 * @Author: George_Chen
 * @Description: an Friend component to display each user's friend
 *
 * @param {String}      this.props.avatar, the friend's avatar
 * @param {String}      this.props.nickName, the friend's nickName
 * @param {String}      this.props.uid, friend's uid
 * @param {String}      this.props.group, an friend group name
 * @param {Boolean}     this.props.isOnline, status about user online or not
 */
var Friend = React.createClass({
    mixins: [FluxibleMixin],

    _openHangout: function() {
        var selfUid = this.props.self;
        var info = this.props.info;
        this.executeAction(OpenHangout, {
            channelId: SharedUtils.get1on1ChannelId(info.uid, selfUid),
            hangoutTitle: info.nickName
        });
    },

    render: function(){
        var info = this.props.info;
        var stateColor = (info.isOnline ? "onlineState" : "offlineState");
        return (
            <div className="Friend">
                <div className="pure-u-5-24">
                    <UserAvatar avatar={info.avatar}/>
                </div>
                <div className="pure-u-18-24 showContent">
                    <div className="displayName">{info.nickName}</div>
                    <div className="lastMessage"
                        onClick={this._openHangout}
                        style={{'cursor':'pointer'}}>
                        Hello world.</div>
                </div>
                <span className= {stateColor}></span>
            </div>
        );
    }
});

module.exports = Friend;
