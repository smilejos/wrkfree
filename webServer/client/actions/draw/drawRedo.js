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
 * @param {Number}      data.boardId, target board id
 * @param {Function}    callback, callback function
 */
module.exports = function(actionContext, data, callback) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        boardId: SharedUtils.argsCheckAsync(data.boardId, 'boardId')
    }).then(function(data) {
        return DrawService.drawRedoAsync(data);
    }).then(function(result) {
        if (!result) {
            throw new Error('draw redo error from server side');
        }
        return actionContext.dispatch('ON_DRAW_REDO', data);
    }).catch(function(err) {
        SharedUtils.printError('drawRedo.js', 'core', err);
        return null;
        // show alert message ?
    }).nodeify(callback);
};
