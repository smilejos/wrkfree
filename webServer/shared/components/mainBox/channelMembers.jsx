var React = require('react');

/**
 * child components
 */
var UserAvatar = require('../common/userAvatar.jsx');

/**
 * @Author: George_Chen
 * @Description: ChannelMembers display avatars of memberlist 
 * 
 * @param {String}      this.props.members, channel's member list
 */
module.exports = React.createClass({
    render: function(){
        var list = this.props.members.map(function(info){
            return (
                <li className="MemberAvatar" key={info.uid+'memberAvatar'}>
                    <UserAvatar isCircle={true} avatar={info.avatar}/>
                </li>
            );
        }, this);
        return (
            <div className="ChannelMembers">
                <ul className="pure-menu-horizontal pure-menu">
                    {list}
                </ul>
            </div>
        );
    }
});
