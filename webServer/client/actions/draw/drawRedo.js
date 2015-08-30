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
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        boardId: SharedUtils.argsCheckAsync(data.boardId, 'boardId')
    }).then(function(reqData) {
        actionContext.dispatch('CLEAN_LOCAL_DRAW', reqData);
        return DrawService.drawRedoAsync(reqData);
    }).then(function(result) {
        if (!result) {
            throw new Error('draw redo error from server side');
        }
        return actionContext.dispatch('ON_DRAW_REDO', data);
    }).catch(function(err) {
        SharedUtils.printError('drawRedo.js', 'core', err);
        return null;
        // show alert message ?
    });
};
