'use strict';
var SharedUtils = require('../../../../sharedUtils/utils');

/**
 * @Public API
 * @Author: Jos Tung
 * @Description: the action for user to add new drawing board
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Object}      object of drawing option
 * @param {Function}    callback, callback function
 */
module.exports = function(actionContext, data, callback) {
    return actionContext.dispatch('ON_DRAW_MODE_CHANGE', data);
};
