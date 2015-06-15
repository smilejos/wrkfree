var React = require('react');
var Route = require('react-router').Route;
var DefaultRoute = require('react-router').DefaultRoute;

/**
 * child components
 */
var MainApp = require('./MainApp.jsx');
var WorkSpace = require('./WorkSpace.jsx');
var Dashboard = require('./Dashboard.jsx');
var SignUp = require('./SignUp.jsx');
var Error = require('./Error.jsx');

// route are nested as url display,
// e.g. route="/workspace/ch-id" will use the 'WorkSpace.jsx' to replace the 
//      <RouteHandler /> in the 'MainApp.jsx'
var routes = (
    <Route name="app" handler={MainApp} >
        <DefaultRoute handler={Dashboard}/>
        <Route name="workspace" >
            <Route name=":channelId" handler={WorkSpace}/>
            <DefaultRoute handler={Error} />
        </Route>
        <Route name="dashboard" handler={Dashboard}/>
        <Route name="signup" handler={SignUp}/>
    </Route>
);

module.exports = routes;
