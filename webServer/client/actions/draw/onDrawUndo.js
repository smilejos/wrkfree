'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: action for handling draw undo from remote
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
    }).then(function(validData) {
        return actionContext.dispatch('ON_DRAW_UNDO', validData);
    }).catch(function(err) {
        SharedUtils.printError('onDrawUndo.js', 'core', err);
        return null;
        // show alert message ?
    }).nodeify(callback);
};
