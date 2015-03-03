var React = require('react');
var Route = require('react-router').Route;
var DefaultRoute = require('react-router').DefaultRoute;
var MainApp = require('./MainApp.jsx');
var Error = require('./Error.jsx');
var Channel = require('./Channel.jsx');
var Dashboard = require('./Dashboard.jsx');
var SignUp = require('./SignUp.jsx');

// route are nested as url display,
// e.g. route="/chanel/ch-id" will use the 'Channel.jsx' to replace the 
//      <RouteHandler /> in the 'MainApp.jsx'
var routes = (
    <Route name="app" handler={MainApp} >
        <DefaultRoute handler={Dashboard}/>
        <Route name="channel" >
            <Route name=":channelId" handler={Channel}/>
            <DefaultRoute handler={Error} />
        </Route>
        <Route name="dashboard" handler={Dashboard}/>
        <Route name="signup" handler={SignUp}/>
    </Route>
);

module.exports = routes;