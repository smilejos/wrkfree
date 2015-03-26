var React = require('react');
var MainBox = require('./mainBox/ChannelMain.jsx');
var InfoBox = require('./infoBox/ChannelInfo.jsx');

module.exports = React.createClass({
    render: function(){
        return (
            <div>
                <h2> the channel room </h2>
                <MainBox />
                <InfoBox />
            </div>
        );
    }
});