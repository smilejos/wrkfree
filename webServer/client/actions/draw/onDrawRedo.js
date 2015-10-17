'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var ActionUtils = require('../actionUtils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: for handling draw redo action from remote
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, target channel id
 * @param {String}      data._bid, target board uuid
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        _bid: SharedUtils.argsCheckAsync(data._bid, 'string')
    }).then(function(recvData) {
        return actionContext.dispatch('ON_DRAW_REDO', recvData._bid);
    }).catch(function(err) {
        SharedUtils.printError('onDrawRedo.js', 'core', err);
        ActionUtils.showErrorEvent('WARN', 'unexpectedly draw redo');
    });
};
