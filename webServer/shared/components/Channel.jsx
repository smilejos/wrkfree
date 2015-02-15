var React = require('react');
var MainBox = require('./mainBox/channelMain.jsx');
var InfoBox = require('./infoBox/channelInfo.jsx');

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