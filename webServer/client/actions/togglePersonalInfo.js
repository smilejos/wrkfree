'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');
var PersonalStore = require('../../shared/stores/PersonalStore');

/**
 * @Public API
 * @Author: Jos Tung
 * @Description: toggle the personal Info
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Boolean}     data.isActive, indicate component is visible or not
 */
module.exports = function(actionContext, data) {
    console.log('action');
    var store = actionContext.getStore(PersonalStore);
    return Promise.try(function() {
        if (SharedUtils.isBoolean(data.isActive)) {
            return data.isActive;
        }
        return !store.isActive;
    }).then(function(toggleState) {
        return store.toggleAsync(toggleState);
    }).catch(function(err) {
        SharedUtils.printError('togglePersonalInfo.js', 'core', err);
    });
};
