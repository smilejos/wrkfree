'use strict';
var React = require('react');
var Router = require('react-router');
var HistoryLocation = Router.HistoryLocation;
var Promise = require('bluebird');
var FluxibleComponent = require('fluxible/addons/FluxibleComponent');

// define global Promise, 
// this will cause Fluxible to use bluebird as its PromiseLib
window.Promise = Promise;

/**
 * setup configurations for client
 */
var Configs = require('../../configs/config');
Configs.import('params', require('../../configs/parameters.json'));

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
var SocketManager = require('./services/socketManager');

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
    // start the react-router
    return Router.run(app.getComponent(), HistoryLocation, function(Handler, state) {
        return _hasConnection(state).then(function(hasConnection) {
            if (!hasConnection) {
                throw new Error('server connection lost');
            }
            // start the navigation action
            return context.executeAction(navigateAction, state).then(function(){
                RenderApp(context, Handler);
            });
        }).catch(function(err) {
            console.log('[ERROR]', err);
            // TODO: we should redirect to error page
            // location.assign('/');
        });
    });
});

/**
 * @Author: George_Chen
 * @Description: used to render app by resource from server
 *
 * @param {Object}        context, the app context
 * @param {Object}        Handler, the react router handler
 */
function RenderApp(context, Handler) {
    var mountNode = document.getElementById('app');
    var component = React.createFactory(Handler);
    var props = {
        context: context.getComponentContext()
    };
    React.render(
        React.createElement(FluxibleComponent, props, component()),
        mountNode,
        function() {}
    );
}

/**
 * @Author: George_Chen
 * @Description: to check app has socket connection or not
 *
 * @param {Object}        routeState, the react router state object
 */
function _hasConnection(routeState) {
    return new Promise(function(resolver, rejecter) {
        if (routeState.routes[1].name === 'signup') {
            return resolver(true);
        }
        SocketManager.init(function(err) {
            return (err ? rejecter(err) : resolver(true));
        });
    });
}
