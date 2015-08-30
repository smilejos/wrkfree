'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');
var ActionUtils = require('./actionUtils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: toggle viewpoint to current main content
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Boolean}     data.isActive, indicate component is active or not
 */
module.exports = function(actionContext, data) {
    return Promise.try(function() {
        if (SharedUtils.isBoolean(data.isActive)) {
            return data.isActive;
        }
        return true;
    }).then(function(toggleToActive) {
        actionContext.dispatch('TOGGLE_MAIN_VIEWPOINT', {
            isActive: toggleToActive
        });
    }).catch(function(err) {
        SharedUtils.printError('toggleMainViewpoint.js', 'core', err);
        ActionUtils.showWarningEvent('WARN', 'toggle main viewpoint fail');
    });
};
