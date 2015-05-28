'use strict';
var ToggleStore = require('../../shared/stores/ToggleStore');
var SharedUtils = require('../../../sharedUtils/utils');
/**
 * @Public API
 * @Author: Jos Tung
 * @Description: the action for user to add new drawing board
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Object}      data, object of toggle component
 * @param {String}      data.param, the parameter of toggle component
 * @param {Boolean}     data.isVisible, indicate component is visible or not
 */
module.exports = function(actionContext, data) {
 	return Promise.props({
        param: SharedUtils.argsCheckAsync(data.param, 'string'),
        isVisible: SharedUtils.argsCheckAsync(data.isVisible, 'boolean')
    }).then(function(data) {
    	return actionContext.dispatch('ON_TOGGLE_CHANGE', data);    
    }).catch(function(err) {
        SharedUtils.printError('toggleComponent.js', 'core', err);
    });
};
