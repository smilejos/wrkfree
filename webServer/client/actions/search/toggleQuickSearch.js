'use strict';
var SharedUtils = require('../../../../sharedUtils/utils');
var QuickSearchStore = require('../../../shared/stores/QuickSearchStore');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: enable/disable the quickSearch mode 
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.isEnabled, 
 */
module.exports = function(actionContext, data) {
    return SharedUtils.argsCheckAsync(data.isEnabled, 'boolean')
        .then(function(isEnabled) {
            var searchStore = actionContext.getStore(QuickSearchStore);
            if (!isEnabled) {
                actionContext.dispatch('ON_QUICKSEARCH_UPDATE', {
                    users: [],
                    channels: []
                });
            }
            return searchStore.enableSearch(isEnabled);
        }).catch(function(err) {
            SharedUtils.printError('navToBoard.js', 'core', err);
            return null;
        });
};
