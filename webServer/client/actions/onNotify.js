'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: update and inform user that he/her got new notifications
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.type, the type of notifications
 */
module.exports = function(actionContext, data) {
    return Promise.try(function() {
        var hasNotify = true;
        switch (data.type) {
            case 'reqResp':
            case 'normal':
                return actionContext.dispatch('ON_NOTIFY', hasNotify);
            case 'msg':
                return actionContext.dispatch('ON_MSG_NOTIFY', hasNotify);
            default:
                throw new Error('unsupported notification type');
        }
    }).catch(function(err) {
        SharedUtils.printError('onNotify.js', 'core', err);
    });
};
