'use strict';
var React = require('react');
var Router = require('react-router');
var HistoryLocation = Router.HistoryLocation;
var Promise = require('bluebird');
var channelService = require('./services/channelService');

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
    var mountNode = document.getElementById('app');
    // start the react-router
    return Router.run(app.getAppComponent(), HistoryLocation, function(Handler, state) {
        return _hasConnection(state).then(function(hasConnection) {
            if (!hasConnection) {
                throw new Error('server connection lost');
            }
            return _isAuthToEnterChannel(state);
        }).then(function(isAuth) {
            if (!isAuth) {
                throw new Error('not auth to navigate');
            }
            // start the navigation action
            context.executeAction(navigateAction, state, function() {
                React.withContext(context.getComponentContext(), function() {
                    React.render(React.createFactory(Handler)(), mountNode);
                });
            });
        }).catch(function(err) {
            console.log('[ERROR]', err);
            // TODO: we should redirect to error page
            location.assign('/');
        });
    });
});

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

/**
 * @Author: George_Chen
 * @Description: check the authorization if next url is to channel space
 *
 * @param {Object}        routeState, the react router state object
 */
function _isAuthToEnterChannel(routeState) {
    var urlInfo = routeState.params;
    return Promise.try(function() {
        var channel = urlInfo.channelId;
        return (channel ? channelService.enterAsync(urlInfo.channelId) : true);
    });
}
