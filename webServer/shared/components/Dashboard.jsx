var React = require('react');
var MainBox = require('./mainBox/DashboardMain.jsx');
var InfoBox = require('./infoBox/DashboardInfo.jsx');

 
module.exports = React.createClass({
    render: function(){
        return (
            <div>
                <h1> the dashboard </h1>
                <MainBox />
                <InfoBox />
            </div>
        );
    }
});