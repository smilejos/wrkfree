var React = require('react');

/**
 * child components
 */
var UserAvatar = require('../common/userAvatar.jsx');

/**
 * @Author: George_Chen
 * @Description: ChannelHostInfo display info of an channel host
 * 
 * @param {String}      this.props.hostAvatar, the channel host's avatar
 */
module.exports = React.createClass({
    render: function(){
        return (
            <div className='ChannelHostInfo MemberAvatar'>
                <UserAvatar isCircle={true} avatar={this.props.hostAvatar} />
            </div>
        );
    }
});
