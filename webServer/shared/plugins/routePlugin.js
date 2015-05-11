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
                actionContext.getRouteResourceAsync = function(params) {
                    return Promise.try(function() {
                        if (!isHandlerExist(params.path)) {
                            throw new Error('[getRouteResourceAsync] no matched handler', params.path);
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
                    return routeInfo;
                };
            }
        };
    }
};
