'use strict';
var Promise = require('bluebird');
var RouteEntry;
if (typeof window !== 'undefined') {
    RouteEntry = require('../../client/routeEntry');
} else {
    RouteEntry = require('../../server/routeEntry');
}

/**
 * RoutesHandler
 */
var RoutesHandler = {
    '/app/': RouteEntry.getDashboardAsync,
    '/app/dashboard': RouteEntry.getDashboardAsync,
    '/app/workspace': RouteEntry.getWorkSpaceAsync,
    '/app/signup': RouteEntry.getSignUpAsync,
    '/app/error': RouteEntry.getErrorAsync
};

/**
 * @Author: George_Chen
 * @Description: check path dependent RoutesHandler is exist or not
 *
 * @param {String}          path, route path
 */
function isHandlerExist(path) {
    return !!RoutesHandler[path];
}

module.exports = {
    name: 'routePlugin',
    plugContext: function() {

        return {
            plugActionContext: function plugActionContext(actionContext) {
                var routeInfo = {};

                /**
                 * Public API
                 * @Author: George_Chen
                 * @Description: polyfill route resource to matched fluxible stores
                 *
                 * @param {Object}          params, routing parameters
                 */
                actionContext.routePolyfillAsync = function(params) {
                    return Promise.try(function() {
                        if (!isHandlerExist(params.path)) {
                            throw new Error('[routePolyfillAsync] no matched handler', params.path);
                        }
                        var handler = RoutesHandler[params.path];
                        return handler(actionContext, params);
                    });
                };

                /**
                 * Public API
                 * @Author: George_Chen
                 * @Description: pre-fill the route info to action context
                 *
                 * @param {Object}          info, route info object
                 */
                actionContext.setRouteInfo = function(info) {
                    routeInfo = info;
                };

                /**
                 * Public API
                 * @Author: George_Chen
                 * @Description: get the route info object on current action context
                 */
                actionContext.getRouteInfo = function() {
                    return (routeInfo || {});
                };
            }
        };
    }
};
