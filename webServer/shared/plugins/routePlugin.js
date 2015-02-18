var SharedUtils = require('../../../sharedUtils/utils');
var RouteInstance = (typeof window !== 'undefined') 
    ? require('../../client/routeEntry')
    : require('../../server/routeEntry')

var RoutesHandler = {
    '/dashboard': RouteInstance.getDashboard,
    '/channel': RouteInstance.getChannel
};

function isHandlerExist(path) {
    return !!RoutesHandler[path];
}

module.exports = {
    name: 'routePlugin',

    plugContext: function (options) {
        return {
            plugActionContext: function plugActionContext(actionContext) {
                var routeInfo = {};

                actionContext.getRouteResource = function() {                    
                    if (!isHandlerExist) {
                        return callback(new Error('no match handler'));
                    }
                    var args = SharedUtils.getArgs(arguments);
                    var path = args.shift();
                    return RoutesHandler[path].apply(this, args);
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

    // Allows dehydration of application plugin settings
    dehydrate: function () { 
        return {}; 
    },

    // Allows rehydration of application plugin settings
    rehydrate: function (state) {
    }
};