'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var WorkSpaceStore = require('../../../shared/stores/WorkSpaceStore');
var ActionUtils = require('../actionUtils');
var NavToBoard = require('./navToBoard');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: the action for handling remote user add drawing board
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
        var workSpaceStore = actionContext.getStore(WorkSpaceStore);
        var state = workSpaceStore.getState();
        if (state.draw.boardNums !== validData.newBoardId) {
            throw new Error('unexpected draw board add event');
        }
        return actionContext.dispatch('ON_BOARD_ADD', {
            channelId: validData.channelId,
            boardId: validData.newBoardId
        });
    }).then(function() {
        var boardPage = data.newBoardId + 1;
        return ActionUtils.showInfoEvent(
            'Drawing',
            'new board [' + boardPage + '] is has been created!',
            'switch to new board',
            function(navitator) {
                actionContext.executeAction(NavToBoard, {
                    urlNavigator: navitator,
                    channelId: data.channelId,
                    boardId: data.newBoardId
                });
            });
    }).catch(function(err) {
        SharedUtils.printError('onAddDrawBoard.js', 'core', err);
        ActionUtils.showWarningEvent('Drawing', 'handle remote board added event fail');
    }).nodeify(callback);
};
