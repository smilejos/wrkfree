'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var DrawService = require('../../services/drawService');
var NavToBoard = require('./navToBoard');
var ActionUtils = require('../actionUtils');

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
        actionContext.dispatch('ON_BOARD_ADD', {
            channelId: data.channelId,
            boardId: data.newBoardId
        });
    }).then(function() {
        actionContext.executeAction(NavToBoard, {
            urlNavigator: data.urlNavigator,
            channelId: data.channelId,
            boardId: data.newBoardId
        });
        ActionUtils.showSuccessEvent('Drawing', 'add new board successfully');
    }).catch(function(err) {
        SharedUtils.printError('addDrawBoard.js', 'core', err);
        ActionUtils.showWarningEvt('Drawing', 'add draw board fail');
    }).nodeify(callback);
};
