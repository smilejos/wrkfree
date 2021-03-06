'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');
var PersonalStore = require('../../shared/stores/PersonalStore');
var ActionUtils = require('./actionUtils');

/**
 * @Public API
 * @Author: Jos Tung
 * @Description: toggle the personal info to active or not
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Boolean}     data.isActive, indicate component is active or not
 */
module.exports = function(actionContext, data) {
    return Promise.try(function() {
        if (SharedUtils.isBoolean(data.isActive)) {
            return data.isActive;
        }
        return !actionContext.getStore(PersonalStore).isActive;
    }).then(function(toggleToActive) {
        actionContext.dispatch('TOGGLE_PERSONALINFO', {
            isActive: toggleToActive
        });
    }).catch(function(err) {
        SharedUtils.printError('togglePersonalInfo.js', 'core', err);
        ActionUtils.showWarningEvent('WARN', 'toggle personal info fail');
    });
};
