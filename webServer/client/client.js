'use strict';
var React = require('react');
var app = require('../shared/app');
var dehydratedState = window.App; // Sent from the server

window.React = React; // For chrome dev tool support

var Router = require('react-router');
var HistoryLocation = Router.HistoryLocation;
var navigateAction = require('../shared/navigateAction');

/**
 * rehydrate datas from server
 */
app.rehydrate(dehydratedState, function (err, context) {
    if (err) {
        throw err;
    }
    window.context = context;
    var mountNode = document.getElementById('app');

    // start the react-router
    Router.run(app.getAppComponent(), HistoryLocation, function (Handler, state) {
        var actionContext = context.getActionContext();
        actionContext.setRouteInfo({
            time: Date.now()
        });

        context.executeAction(navigateAction, state, function () {
            React.withContext(context.getComponentContext(), function () {
                React.render(React.createFactory(Handler)(), mountNode);
            });
        });
        // TODO: below should be removed
        var openMsgBoxAction = require('./actions/openMsgBox');
        // open the first msg box
        setTimeout(function(){
            context.executeAction(openMsgBoxAction, '5e2e717e84acd6518bbcd43570742d3f');
        }, 1000);
        // open the second msg box
        setTimeout(function(){
            context.executeAction(openMsgBoxAction, '5e2e717e84acd6518bbcd43570742d3c');
        }, 3000);
    });
});