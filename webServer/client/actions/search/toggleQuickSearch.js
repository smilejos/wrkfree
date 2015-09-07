'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var QuickSearchStore = require('../../../shared/stores/QuickSearchStore');
var ActionUtils = require('../actionUtils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: enable/disable the quickSearch mode 
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.isActive, 
 */
module.exports = function(actionContext, data) {
    return Promise.try(function() {
        if (SharedUtils.isBoolean(data.isActive)) {
            return data.isActive;
        }
        return !actionContext.getStore(QuickSearchStore).isActive;
    }).then(function(toggleToActive) {
        actionContext.dispatch('TOGGLE_QUICKSEARCH', {
            isActive: toggleToActive
        });
    }).catch(function(err) {
        SharedUtils.printError('_toggleQuickSearch.js', 'core', err);
        ActionUtils.showWarningEvent('WARN', 'toggle quicksearch bar fail');
    });
};
