var React = require('react');
var MainBox = require('./mainBox/dashboardMain.jsx');
var InfoBox = require('./infoBox/dashboardInfo.jsx');

 
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