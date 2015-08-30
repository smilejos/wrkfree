'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');
var FriendStore = require('../../shared/stores/FriendStore');
var ActionUtils = require('./actionUtils');

/**
 * @Public API
 * @Author: Jos Tung
 * @Description: toggle the friend list to active or not
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Boolean}     data.isActive, indicate component is active or not
 */
module.exports = function(actionContext, data) {
    return Promise.try(function() {
        if (SharedUtils.isBoolean(data.isActive)) {
            return data.isActive;
        }
        return !actionContext.getStore(FriendStore).isActive;
    }).then(function(toggleToActive){
        actionContext.dispatch('TOGGLE_FRIENDLIST', {
            isActive: toggleToActive
        });
    }).catch(function(err) {
        SharedUtils.printError('toggleFriendList.js', 'core', err);
        ActionUtils.showWarningEvent('WARN', 'toggle friend list fail');
    });
};
