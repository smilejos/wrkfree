'use strict';
var Promise = require('bluebird');
var RouteInstance;
if (typeof window !== 'undefined') {
    RouteInstance = require('../../client/routeEntry');
} else {
    RouteInstance = require('../../server/routeEntry');
}

/**
 * RoutesHandler
 */
var RoutesHandler = {
    '/app/': RouteInstance.getDashboardAsync,
    '/app/dashboard': RouteInstance.getDashboardAsync,
    '/app/channel': RouteInstance.getChannelAsync,
    '/app/signup': RouteInstance.getSignUpAsync
};

function isHandlerExist(path) {
    return !!RoutesHandler[path];
}

module.exports = {
    name: 'routePlugin',
    plugContext: function() {

        return {
            plugActionContext: function plugActionContext(actionContext) {
                var routeInfo = {};
                actionContext.getRouteResourceAsync = function(params) {
                    return Promise.try(function() {
                        if (!isHandlerExist(params.path)) {
                            throw new Error('[getRouteResourceAsync] no matched handler', params.path);
                        }
                        var handler = RoutesHandler[params.path];
                        return handler(actionContext, params);
                    });
                };
                actionContext.setRouteInfo = function(info) {
                    routeInfo = info;
                };

                actionContext.getRouteInfo = function() {
                    return routeInfo;
                };
            }
        };
    }
};
