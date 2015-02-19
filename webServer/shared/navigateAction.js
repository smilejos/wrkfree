var ObjectAssign = require('object-assign');

module.exports = function(actionContext, payload, done) {
    var routeInfo = actionContext.getRouteInfo();
    var urlInfo = getUrlInfo(payload);
    var args = ObjectAssign(routeInfo, urlInfo);

    actionContext.getRouteResourceAsync(args).then(function(data) {
        actionContext.dispatch('CHANGE_ROUTE', payload);
        done();
    });
};

/**
 * @Author: George_Chen
 * @Description: get the useful info from react-router state
 *
 * @param {Object}      routerState, the react-router state
 */
function getUrlInfo(routerState) {
    var info = routerState.params;
    var routesIndex = routerState.routes.length - 1;
    // check the info has url params or not
    (Object.keys(info).length === 0) 
        ? info.path = routerState.routes[routesIndex].path
        : info.path = routerState.routes[routesIndex - 1].path
    return info;
}
