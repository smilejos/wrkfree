var React = require('react');
var FriendList = require('./friendList.jsx');

var DashboardInfo = React.createClass({
    render: function() {
        return (
            <div className="infoBox DashboardInfo">
                <FriendList />
            </div>
        );
    }
});

module.exports = DashboardInfo;