var React = require('react');
var FriendList = require('./friendList.jsx');

var ChannelInfo = React.createClass({
    render: function() {
        return (
            <div className="infoBox ChannelInfo">
                <FriendList />
            </div>
        );
    }
});

module.exports = ChannelInfo;