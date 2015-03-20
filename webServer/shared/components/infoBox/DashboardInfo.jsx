var React = require('react');
var FriendList = require('./friendList.jsx');

var DashboardInfo = React.createClass({
    render: function() {
        return (
            <div className="infoBox DashboardInfo">
                    info_box
                <FriendList />
            </div>
        );
    }
});

module.exports = DashboardInfo;