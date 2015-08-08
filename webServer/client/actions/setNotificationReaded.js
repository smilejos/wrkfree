'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');
var ReqRespService = require('../services/reqRespService');
var ActionUtils = require('./actionUtils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: for user to mark specific notification as readed
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Boolean}     data.reqId, the notification reqResp id
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        reqId: SharedUtils.argsCheckAsync(data.reqId, '_id')
    }).then(function(reqData) {
        return ReqRespService.readReqRespAsync(reqData);
    }).then(function(result) {
        if (result !== null) {
            return actionContext.dispatch('DELETE_NOTIFICATION', data);
        }
        return ActionUtils.showWarningEvent('Notification', 'update fail !');
    }).catch(function(err) {
        SharedUtils.printError('setDashboardLayout.js', 'core', err);
        ActionUtils.showErrorEvent('Notification', 'unexpected error');
    });
};
