'use strict';
var React = require('react');
var Router = require('react-router');
var HistoryLocation = Router.HistoryLocation;

/**
 * collect state infomation sent from server
 */
var dehydratedState = window.App;
window.React = React; // For chrome dev tool support

/**
 * initialize fluxible app configurations
 */
var app = require('../shared/app');

/**
 * actions
 */
var navigateAction = require('../shared/navigateAction');


/**
 * initailize the connection manager
 */
require('./services/socketManager');

/**
 * rehydrate datas from server
 */
app.rehydrate(dehydratedState, function(err, context) {
    /**
     * TODO: should we redirect to "/" when error occured ?
     */
    if (err) {
        throw err;
    }
    window.context = context;
    var mountNode = document.getElementById('app');

    // start the react-router
    Router.run(app.getAppComponent(), HistoryLocation, function(Handler, state) {
        // start the navigation action
        context.executeAction(navigateAction, state, function() {
            React.withContext(context.getComponentContext(), function() {
                React.render(React.createFactory(Handler)(), mountNode);
            });
        });
    });
});
