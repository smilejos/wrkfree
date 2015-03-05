var Promise = require('bluebird');
var SharedUtils = require('../../sharedUtils/utils');

exports.setResource = function(resource){
    console.log('set resource on server');        
}

exports.getDashboardAsync = function(actionContext, routeInfo){
    return Promise.try(function(){
        // do something
        return {
            result: 'done'
        };
    });
}

exports.getChannelAsync = function(actionContext, routeInfo){
    return Promise.try(function(){
        // do something
        return {
            result: 'done'
        };
    });
}

/**
 * Public API
 * @Author: George_Chen
 * @Description: getting the resoure for signup page
 *
 * @param {Object}      actionContext, fluxible actionContext
 * @param {Object}      params, params are object combined with routeInfo and urlInfo
 * NOTE: routeInfo is stored at routePlugin.js
 *       urlInfo is extract from react-router
 */
exports.getSignUpAsync = function(actionContext, routeInfo) {
    return Promise.try(function(){
        return {
            signUpInfo: JSON.parse(routeInfo.userInfo)
        };
    }).catch(function(err){
        SharedUtils.printError('server-routeEntry', 'getSignUpAsync', err);
        return {};
    });
};