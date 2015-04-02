'use strict';
var ObjectAssign = require('object-assign');

module.exports = function(actionContext, payload, done) {
    var routeInfo = actionContext.getRouteInfo();
    var urlInfo = _getUrlInfo(payload);
    var args = ObjectAssign(routeInfo, urlInfo);

    actionContext.getRouteResourceAsync(args).then(function(resource) {
        payload.resource = resource;
        actionContext.dispatch('CHANGE_ROUTE', payload);
    }).catch(function(err){
        return console.log('[navigateAction]', err);
    }).nodeify(done);
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
    var pathIndex = (Object.keys(info).length === 0 ? lastIndex : lastIndex-1);
    info.path = routerState.routes[pathIndex].path;
    return info;
}
