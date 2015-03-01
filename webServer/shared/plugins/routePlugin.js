var SharedUtils = require('../../../sharedUtils/utils');
var RouteInstance = (typeof window !== 'undefined') 
    ? require('../../client/routeEntry')
    : require('../../server/routeEntry')
var Promise = require('bluebird');

/**
 * RoutesHandler
 */
var RoutesHandler = {
    '/app/': RouteInstance.getDashboardAsync,
    '/app/dashboard': RouteInstance.getDashboardAsync,
    '/app/channel': RouteInstance.getChannelAsync
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
                    return Promise.try(function(){
                        if (!isHandlerExist(params.path)) {
                            throw new Error('[getRouteResourceAsync] no matched handler');
                        }
                        var handler = RoutesHandler[params.path];
                        return handler(params);
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
    }
};