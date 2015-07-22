'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');
var FriendStore = require('../../shared/stores/FriendStore');

/**
 * @Public API
 * @Author: Jos Tung
 * @Description: toggle the friend list
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Boolean}     data.isActive, indicate component is visible or not
 */
module.exports = function(actionContext, data) {
    var store = actionContext.getStore(FriendStore);
    return Promise.try(function() {
        if (SharedUtils.isBoolean(data.isActive)) {
            return data.isActive;
        }
        return !store.isActive;
    }).then(function(toggleState) {
        return store.toggleAsync(toggleState);
    }).catch(function(err) {
        SharedUtils.printError('toggleFriendList.js', 'core', err);
    });
};
