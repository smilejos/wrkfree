'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');
var ActionUtils = require('./actionUtils');
var UserService = require('../services/userService');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: action for sending client's opinion to us
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.message, the content of this message
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        message: SharedUtils.argsCheckAsync(data.message, 'string')
    }).then(function(reqData) {
        if (SharedUtils.stringToBytes(reqData.message) < 3) {
            return ActionUtils.showWarningEvent('WARN', 'invalid opinion');
        }
        return UserService.clientReportAsync(reqData)
            .then(function(result) {
                if (result === null) {
                    throw new Error('client report fail');
                }
                ActionUtils.showSuccessEvent('Thanks', 'we have receive your message');
            });
    }).catch(function(err) {
        SharedUtils.printError('clientReport.js', 'core', err);
        ActionUtils.showWarningEvent('WARN', 'fail to send your opinion');
    });
};
