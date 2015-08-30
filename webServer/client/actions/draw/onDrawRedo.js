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
 * @param {Number}      data.boardId, target board id
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        boardId: SharedUtils.argsCheckAsync(data.boardId, 'boardId')
    }).then(function(reqData) {
        return actionContext.dispatch('ON_DRAW_REDO', reqData);
    }).catch(function(err) {
        SharedUtils.printError('onDrawRedo.js', 'core', err);
        ActionUtils.showErrorEvent('WARN', 'unexpectedly draw redo');
    });
};
