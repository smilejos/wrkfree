var SharedUtils = require('../../../sharedUtils/utils');
var RouteInstance = (typeof window !== 'undefined') 
    ? require('../../client/routeEntry')
    : require('../../server/routeEntry')

/**
 * RoutesHandler
 */
var RoutesHandler = {
    '/': RouteInstance.getDashboardAsync,
    '/dashboard': RouteInstance.getDashboardAsync,
    '/channel': RouteInstance.getChannelAsync
};

function isHandlerExist(path) {
    return !!RoutesHandler[path];
}

/**
 * for saving recently routing resource
 */
var routeResource = null;

module.exports = {
    name: 'routePlugin',
    plugContext: function (options) {
        return {
            plugActionContext: function plugActionContext(actionContext) {
                var routeInfo = {};

                actionContext.getRouteResourceAsync = function(params) {
                    if (!isHandlerExist(params.path)) {
                        throw new Error('no match handler');
                    }
                    var handler = RoutesHandler[params.path];
                    return handler(params).then(function(data){
                        // update the route resource
                        routeResource = data;
                        return data;
                    });
                },
                actionContext.setRouteInfo = function(info){
                    routeInfo = info;
                },

                actionContext.getRouteInfo = function(){
                    return routeInfo;
                }
            }
        }
    },

    // extract the latest routing resource and send to remote side
    dehydrate: function () {
        return routeResource;
    },

    // update the routing resource from remote side
    rehydrate: function (resource) {
        routeResource = resource;
        return RouteInstance.setResource(resource);
    }
};