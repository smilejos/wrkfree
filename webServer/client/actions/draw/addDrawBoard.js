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
 * @param {Number}      data.newBoardIdx, the new added board index
 * @param {Function}    callback, callback function
 */
module.exports = function(actionContext, data, callback) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        newBoardIdx: SharedUtils.argsCheckAsync(data.newBoardIdx, 'number')
    }).then(function(reqData) {
        return DrawService.addBoardAsync(reqData);
    }).then(function(result) {
        if (!result) {
            throw new Error('add draw board fail');
        }
        actionContext.dispatch('ON_BOARD_ADD', {
            channelId: data.channelId,
            newBoardIdx: data.newBoardIdx
        });
    }).then(function() {
        actionContext.executeAction(NavToBoard, {
            urlNavigator: data.urlNavigator,
            channelId: data.channelId,
            boardIdx: data.newBoardIdx
        });
        ActionUtils.showSuccessEvent('Drawing', 'add board successfully');
    }).catch(function(err) {
        SharedUtils.printError('addDrawBoard.js', 'core', err);
        ActionUtils.showWarningEvent('Drawing', 'add draw board fail');
    }).nodeify(callback);
};
