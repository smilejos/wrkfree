var Promise = require('bluebird');
var SharedUtils = require('../../sharedUtils/utils');

exports.setResource = function(resource){
    console.log('set resource on server');        
}

/**
 * Public API
 * @Author: George_Chen
 * @Description: getting the resource for route '/dashboard'
 *
 * @param {Object}      actionContext, fluxible actionContext
 * @param {Object}      routeInfo, route infomation for dashboard route
 */
exports.getDashboardAsync = function(actionContext, routeInfo){
    var user = routeInfo.user;
    var friendStorage = routeInfo.storageManager.getService('Friend');

    return Promise.props({
        FriendStore: friendStorage.getFriendListAsync(user.email, user.email)
    }).then(function(resource){
        return _storesPolyfill(actionContext, resource);
    }).catch(function(err){
        SharedUtils.printError('server-routeEntry', 'getDashboardAsync', err);
        return {};
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: getting the resource for route '/channel'
 *
 * @param {Object}      actionContext, fluxible actionContext
 * @param {Object}      routeInfo, route infomation for channel route
 */
exports.getChannelAsync = function(actionContext, routeInfo){
    var user = routeInfo.user;
    var channelId = routeInfo.channelId;
    var friendStorage = routeInfo.storageManager.getService('Friend');

    return Promise.props({
        FriendStore: friendStorage.getFriendListAsync(user.email, user.email)
    }).then(function(resource){
        return _storesPolyfill(actionContext, resource);
    }).catch(function(err){
        SharedUtils.printError('server-routeEntry', 'getChannelAsync', err);
        return {};
    });
};

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
            signUpInfo: routeInfo.userInfo
        };
    }).catch(function(err){
        SharedUtils.printError('server-routeEntry', 'getSignUpAsync', err);
        return {};
    });
};

/**
 * @Author: George_Chen
 * @Description: polyfill each flux store based on storedata
 *
 * @param {Object}      actionContext, fluxible actionContext
 * @param {Object}      storeData, flux store datas
 */
function _storesPolyfill(actionContext, storeData) {
    var stores = Object.keys(storeData);
    return Promise.map(stores, function(storeName){
        var store = actionContext.getStore(storeName);
        return store.polyfillAsync(storeData[storeName]);
    });
}