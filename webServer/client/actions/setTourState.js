'use strict';
var SharedUtils = require('../../../sharedUtils/utils');
var Promise = require('bluebird');
var ActionUtils = require('./actionUtils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: for user to set his current tourguide to shown or not
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Boolean}     data.isShown, indicate tourguide to shown or not
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        isShown: data.isShown
    }).then(function(reqData) {
        return actionContext.dispatch('SET_TOURGUIDE_STATE', {
            isShown: reqData.isShown
        });
    }).catch(function(err) {
        SharedUtils.printError('hideTourGuide.js', 'core', err);
        ActionUtils.showWarningEvent('WARN', 'set tourguide fail');
    });
};
