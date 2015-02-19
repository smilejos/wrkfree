var Promise = require('bluebird');

exports.setResource = function(resource){
    console.log('set resource on server');        
}

exports.getDashboardAsync = function(routeInfo){
    return Promise.try(function(){
        // do something
        return {
            result: 'done'
        };
    });
}

exports.getChannelAsync = function(routeInfo){
    return Promise.try(function(){
        // do something
        return {
            result: 'done'
        };
    });
}
