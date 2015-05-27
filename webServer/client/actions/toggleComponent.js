'use strict';
var ToggleStore = require('../../shared/stores/ToggleStore');

/**
 * @Public API
 * @Author: Jos Tung
 * @Description: the action for user to add new drawing board
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Object}      object of toggle component
 */
module.exports = function(actionContext, data) {
    return actionContext.dispatch('ON_TOGGLE_CHANGE', data);
};