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
 * @param {Number}      data.newBoardIdx, the index of new added board
 * @param {Function}    callback, callback function
 */
module.exports = function(actionContext, data, callback) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        newBoardIdx: SharedUtils.argsCheckAsync(data.newBoardIdx, 'number')
    }).then(function(recvData) {
        var workSpaceStore = actionContext.getStore(WorkSpaceStore);
        var state = workSpaceStore.getState();
        if (state.draw.boardNums !== recvData.newBoardIdx) {
            throw new Error('unexpected draw board add event');
        }
        return actionContext.dispatch('ON_BOARD_ADD', {
            channelId: recvData.channelId,
            newBoardIdx: recvData.newBoardIdx
        });
    }).then(function() {
        var boardPage = data.newBoardIdx + 1;
        return ActionUtils.showInfoEvent(
            'Drawing',
            'new board [' + boardPage + '] is has been created!',
            'switch to new board',
            function(navitator) {
                actionContext.executeAction(NavToBoard, {
                    urlNavigator: navitator,
                    channelId: data.channelId,
                    boardIdx: data.newBoardIdx
                });
            });
    }).catch(function(err) {
        SharedUtils.printError('onAddDrawBoard.js', 'core', err);
        ActionUtils.showWarningEvent('Drawing', 'handle remote board added event fail');
    }).nodeify(callback);
};
