'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var DrawService = require('../../services/drawService');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: action for user to redo next draw
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, target channel id
 * @param {String}      data._bid, the board uuid
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        _bid: SharedUtils.argsCheckAsync(data._bid, 'string')
    }).then(function(reqData) {
        return DrawService.drawRedoAsync(reqData);
    }).then(function(result) {
        if (!result) {
            throw new Error('draw redo error from server side');
        }
        return actionContext.dispatch('ON_DRAW_REDO', data._bid);
    }).catch(function(err) {
        SharedUtils.printError('drawRedo.js', 'core', err);
        return null;
        // show alert message ?
    });
};
