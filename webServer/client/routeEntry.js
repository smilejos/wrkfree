var Promise = require('bluebird');
var SignUpStore = require('../shared/stores/SignUpStore');
var SharedUtils = require('../../sharedUtils/utils');

exports.setResource = function(resource){
    console.log('set resource on client');    
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
exports.getSignUpAsync = function(actionContext, params) {
    return Promise.try(function(){
        var signUpResource = actionContext.getStore(SignUpStore).getState();
        if (!signUpResource) {
            throw new Error('Singup Store should not be empty');
        }
        return {
            signUpInfo: signUpResource.originInfo
        };
    }).catch(function(err){
        SharedUtils.printError('client-routeEntry', 'getSignUpAsync', err);
        // should not allowed 'CHANGE_ROUTE', so simply throw an error
        throw err;
    });
};
