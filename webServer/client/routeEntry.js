'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../sharedUtils/utils');

/**
 * flux stores
 */
var SignUpStore = require('../shared/stores/SignUpStore');
var HeaderStore = require('../shared/stores/HeaderStore');
var FriendStore = require('../shared/stores/friendStore');
var DashboardStore = require('../shared/stores/DashboardStore');

/**
 * socket services
 */
var FriendService = require('./services/friendService');
var ChannelService = require('./services/channelService');

/**
 * Public API
 * @Author: George_Chen
 * @Description: getting the resource for route '/dashboard'
 *
 * @param {Object}      actionContext, fluxible actionContext
 * @param {Object}      routeInfo, route infomation for dashboard route
 */
exports.getDashboardAsync = function(actionContext, routeInfo) {
    var headerStore = actionContext.getStore(HeaderStore);
    var selfInfo = headerStore.getSelfInfo();
    return Promise.props({
        FriendStore: _getFriendResource(actionContext, selfInfo),
        DashboardStore: _getDashboardResource(actionContext)
    }).then(function(resource) {
        return _storesPolyfill(actionContext, resource);
    }).catch(function(err) {
        SharedUtils.printError('client-routeEntry', 'getDashboardAsync', err);
        return {};
    });
};

exports.getChannelAsync = function(actionContext, routeInfo) {
    return Promise.try(function() {
        // do something
        return {
            result: 'done'
        };
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
exports.getSignUpAsync = function(actionContext, params) {
    return Promise.try(function() {
        var signUpResource = actionContext.getStore(SignUpStore).getState();
        if (!signUpResource) {
            throw new Error('Singup Store should not be empty');
        }
        return {
            signUpInfo: signUpResource.originInfo
        };
    }).catch(function(err) {
        SharedUtils.printError('client-routeEntry', 'getSignUpAsync', err);
        // should not allowed 'CHANGE_ROUTE', so simply throw an error
        throw err;
    });
};

/**
 * @Author: George_Chen
 * @Description: get friend resource if friendStore is not polyfilled
 *
 * @param {Object}      actionContext, fluxible actionContext
 * @param {Object}      userInfo, the info of login's user
 */
function _getFriendResource(actionContext, userInfo) {
    var friendStore = actionContext.getStore(FriendStore);
    if (!friendStore.isPolyFilled) {
        return FriendService.getFriendListAsync(userInfo.uid);
    }
    return null;
}

/**
 * @Author: George_Chen
 * @Description: get dashboard resource if dashboardStore is not polyfilled
 *
 * @param {Object}      actionContext, fluxible actionContext
 * @param {Object}      userInfo, the info of login's user
 */
function _getDashboardResource(actionContext) {
    var dashboardStore = actionContext.getStore(DashboardStore);
    if (!dashboardStore.isPolyFilled) {
        return Promise.props({
            layout: 'grid', // TODO: should be store at userModel
            channels: ChannelService.findByAuthorizedAsync()
        });
    }
    return null;
}

/**
 * @Author: George_Chen
 * @Description: polyfill stores based on storeData
 * NOTE: properties of storeData is the storeName, and the 
 *       value of each property is the data ready for polyfilled
 *
 * @param {Object}      actionContext, fluxible actionContext
 * @param {Object}      storeData, stores json data 
 */
function _storesPolyfill(actionContext, storeData) {
    return Promise.try(function() {
        return Object.keys(storeData);
    }).map(function(storeName) {
        var store = actionContext.getStore(storeName);
        if (storeData[storeName]) {
            return store.polyfillAsync(storeData[storeName]);
        }
        return null;
    }).catch(function(err) {
        SharedUtils.printError('client-routeEntry', '_storesPolyfill', err);
        return null;
    });
}
