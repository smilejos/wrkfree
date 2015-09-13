'use strict';
var SharedUtils = require('../../../sharedUtils/utils');
var UserService = require('../services/userService');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: for user to check his default tourguide state
 * 
 * @param {Object}      actionContext, the fluxible's action context
 */
module.exports = function(actionContext) {
    return UserService.getDefaultTourStateAsync()
        .then(function(recvData) {
            if (!recvData) {
                throw new Error('get tour guide state fail on server side');
            }
            actionContext.dispatch('SET_DEFAULT_TOURGUIDE_STATE', {
                isDefaultHidden: recvData.isHidden
            });
        }).catch(function(err) {
            SharedUtils.printError('getDefaultTourState.js', 'core', err);
        });
};
