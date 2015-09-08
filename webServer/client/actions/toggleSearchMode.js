'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');
var QuickSearchStore = require('../../shared/stores/QuickSearchStore');
var ActionUtils = require('./actionUtils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: for user to change current search mode layout (list or grid)
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Boolean}     data.isGridResults, 
 */
module.exports = function(actionContext, data) {
    return Promise.try(function() {
        if (SharedUtils.isBoolean(data.isGridResults)) {
            return data.isGridResults;
        }
        return !actionContext.getStore(QuickSearchStore).isGridResults;
    }).then(function(toGrid) {
        actionContext.dispatch('TOGGLE_SEARCH_MODE', {
            isGridResults: toGrid
        });
    }).catch(function(err) {
        SharedUtils.printError('_toggleSearchMode.js', 'core', err);
        ActionUtils.showWarningEvent('WARN', 'change search result mode fail');
    });
};
