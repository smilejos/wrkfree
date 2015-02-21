'use strict';
var React = require('react');
var app = require('../shared/app');
var dehydratedState = window.App; // Sent from the server

/**
 * setup custom plugin
 */
var storePlugin = app.getPlugin('storePlugin');
storePlugin.envSetup({
    lokijs: window.loki
});

/**
 * initialize the pomelo
 */
window.protobuf = require('pomelo-protobuf');
window.EventEmitter = require('eventemitter2');
window.Protocol = require('./lib/pomeloProtocol');
window.pomelo = require('./lib/pomeloClient');

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
    });
});