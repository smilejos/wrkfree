var React = require('react');
var Route = require('react-router').Route;
var DefaultRoute = require('react-router').DefaultRoute;
var MainApp = require('./MainApp.jsx');
var Error = require('./Error.jsx');
var Channel = require('./Channel.jsx');
var Dashboard = require('./Dashboard.jsx');

// route are nested as url display,
// e.g. route="/chanel/ch-id" will use the 'Channel.jsx' to replace the 
//      <RouteHandler /> in the 'MainApp.jsx'
var routes = (
    <Route handler={MainApp} >
        <Route name="channel" >
            <Route name=":channelId" handler={Channel}/>
            <DefaultRoute handler={Error} />
        </Route>
        <DefaultRoute name="dashboard" handler={Dashboard}/>
    </Route>
);

module.exports = routes;