'use strict';
var Promise = require('bluebird');
var SubscriptionStore = require('../../shared/stores/SubscriptionStore');
var SharedUtils = require('../../../sharedUtils/utils');
var ActionUtils = require('./actionUtils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: toggle the subscription list to active or not
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Boolean}     data.isActive, indicate component is active or not
 */
module.exports = function(actionContext, data) {
    return Promise.try(function() {
        if (SharedUtils.isBoolean(data.isActive)) {
            return data.isActive;
        }
        return !actionContext.getStore(SubscriptionStore).getState().isActive;
    }).then(function(toggleToActive) {
        actionContext.dispatch('TOGGLE_SUBSCRIPTIONLIST', {
            isActive: toggleToActive
        });
    }).catch(function(err) {
        SharedUtils.printError('toogleChannelNav.js', 'core', err);
        ActionUtils.showWarningEvent('WARN', 'toggle subscription list fail');
    });
};
