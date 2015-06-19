'use strict';
var SharedUtils = require('../../../../sharedUtils/utils');

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
        .then(function(searchEnable) {
            if (!searchEnable) {
                actionContext.dispatch('ON_QUICKSEARCH_UPDATE', {
                    users: [],
                    channels: []
                });
            }
            actionContext.dispatch('TOGGLE_QUICKSEARCH', {
                isEnabled: searchEnable
            });
        }).catch(function(err) {
            SharedUtils.printError('navToBoard.js', 'core', err);
            return null;
        });
};
