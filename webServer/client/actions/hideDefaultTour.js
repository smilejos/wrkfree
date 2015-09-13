'use strict';
var SharedUtils = require('../../../sharedUtils/utils');
var UserService = require('../services/userService');
var ActionUtils = require('./actionUtils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: for user to update his default tour guide state to hidden
 * 
 * @param {Object}      actionContext, the fluxible's action context
 */
module.exports = function(actionContext) {
    return UserService.hideDefaultTourAsync()
        .then(function(result) {
            if (!result) {
                throw new Error('get tour guide state fail on server side');
            }
            actionContext.dispatch('HIDE_DEFAULT_TOURGUIDE_STATE');
        }).catch(function(err) {
            SharedUtils.printError('hideDefaultTour.js', 'core', err);
            ActionUtils.showWarningEvent('WARN', 'update tourguide state fail!');
        });
};
