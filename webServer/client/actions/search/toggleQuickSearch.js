'use strict';
var SharedUtils = require('../../../../sharedUtils/utils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: enable/disable the quickSearch mode 
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.isActive, 
 */
module.exports = function(actionContext, data) {
    return SharedUtils.argsCheckAsync(data.isActive, 'boolean')
        .then(function(searchEnable) {
            if (!searchEnable) {
                actionContext.dispatch('ON_QUICKSEARCH_UPDATE', {
                    users: [],
                    channels: []
                });
            }
            actionContext.dispatch('TOGGLE_QUICKSEARCH', {
                isActive: searchEnable
            });
        }).catch(function(err) {
            SharedUtils.printError('navToBoard.js', 'core', err);
            return null;
        });
};
