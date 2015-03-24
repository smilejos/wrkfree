var React = require('react');
var UserAvatar = require('./userAvatar.jsx');

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
                    <div className="lastMessage">Hello world.</div>
                </div>
                <span className= {stateColor}></span>
            </div>
        );
    }
});

module.exports = Friend;
