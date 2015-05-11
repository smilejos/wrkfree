'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var DrawService = require('../../services/drawService');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: the action for user to add new drawing board
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, target channel id
 * @param {Number}      data.newBoardId, new added board id
 * @param {Function}    callback, callback function
 */
module.exports = function(actionContext, data, callback) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        newBoardId: SharedUtils.argsCheckAsync(data.newBoardId, 'boardId')
    }).then(function(validData) {
        return DrawService.addBoardAsync(validData);
    }).then(function(result) {
        if (!result) {
            throw new Error('add draw board fail');
        }
        return actionContext.dispatch('ON_BOARD_ADD', {
            channelId: data.channelId,
            boardId: data.newBoardId,
            toNewBoard: true
        });
    }).catch(function(err) {
        SharedUtils.printError('addDrawBoard.js', 'core', err);
        return null;
        // show alert message ?
    }).nodeify(callback);
};
