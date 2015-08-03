'use strict';
var ObjectAssign = require('object-assign');
var MainAppStore = require('./stores/MainAppStore');
var Promise = require('bluebird');

module.exports = function(actionContext, payload) {
    var appStore = actionContext.getStore(MainAppStore);
    if (appStore.isRepeatNavigated(payload)) {
        return;
    }
    return Promise.try(function(){
        var routeInfo = actionContext.getRouteInfo();
        var urlInfo = _getUrlInfo(payload);
        var args = ObjectAssign(routeInfo, urlInfo);
        appStore.setNavigatingRoute(payload);
        return actionContext.routePolyfillAsync(args);
    }).then(function() {
        actionContext.dispatch('CHANGE_ROUTE', payload);
    }).catch(function(err) {
        return console.log('[navigateAction]', err);
        throw new Error('navigate route error');
        // disaptch error route ???
    });
};

/**
 * @Author: George_Chen
 * @Description: get the useful info from react-router state
 *
 * @param {Object}      routerState, the react-router state
 */
function _getUrlInfo(routerState) {
    if (routerState.routes.length === 0) {
        return {};
    }
    var info = routerState.params;
    var lastIndex = routerState.routes.length - 1;
    // to get the real url index
    var pathIndex = (Object.keys(info).length === 0 ? lastIndex : lastIndex - 1);
    info.path = routerState.routes[pathIndex].path;
    info.query = routerState.query;
    return info;
}
