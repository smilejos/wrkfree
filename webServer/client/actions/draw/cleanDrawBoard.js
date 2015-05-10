'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var DrawService = require('../../services/drawService');
var DrawUtils = require('../../../../sharedUtils/drawUtils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: action for user to clean current draw board
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, target channel id
 * @param {Number}      data.boardId, target board id
 * @param {Function}    callback, callback function
 */
module.exports = function(actionContext, data, callback) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        boardId: SharedUtils.argsCheckAsync(data.boardId, 'number')
    }).then(function(validData) {
        return DrawService.cleanDrawBoardAsync(validData);
    }).then(function(result) {
        if (!result) {
            throw new Error('clean draw board fail from server side');
        }
        var cleanDoc = DrawUtils.generateCleanRecord(data.channelId, data.boardId);
        return actionContext.dispatch('ON_RECORD_SAVE', cleanDoc);
    }).catch(function(err) {
        SharedUtils.printError('cleanDrawBoard.js', 'core', err);
        return null;
        // show alert message ?
    }).nodeify(callback);
};
