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
        var info = this.props;
        return (
            <div className="Friend">
                <UserAvatar avatar={info.avatar}/>
            </div>
        );
    }
});

module.exports = Friend;
