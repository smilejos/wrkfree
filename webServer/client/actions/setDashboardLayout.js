'use strict';
var SharedUtils = require('../../../sharedUtils/utils');
var UserService = require('../services/userService');
var Promise = require('bluebird');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: for user to set his/her dashboard layout
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Boolean}     data.isDashboardGrid, to indicate layout is grid or not
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        isDashboardGrid: SharedUtils.argsCheckAsync(data.isDashboardGrid, 'boolean')
    }).then(function(reqData) {
        return UserService.setDashboardLayoutAsync(reqData);
    }).then(function(result) {
        if (!result) {
            console.log('set layout fail on server side');
        }
        actionContext.dispatch('SET_DASHBOARD_LAYOUT', data);
    }).catch(function(err) {
        SharedUtils.printError('setDashboardLayout.js', 'core', err);
    });
};
