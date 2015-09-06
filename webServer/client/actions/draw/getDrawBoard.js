'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var DrawService = require('../../services/drawService');
var DrawStore = require('../../../shared/stores/DrawStore');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: action for user to get draw board infomation on current board
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
    }).then(function(reqData) {
        var drawStore = actionContext.getStore(DrawStore);
        if (!drawStore.isPolyFilled(reqData.channelId, reqData.boardId)) {
            return DrawService.getDrawBoardAsync(reqData);
        }
        // don't need to polyfill, just trigger store change for update component
        drawStore.emitChange();
        return {};
    }).then(function(boardData) {
        if (!boardData.baseImg && !boardData.records) {
            return null;
        }
        return actionContext.dispatch('ON_BOARD_POLYFILL', {
            channelId: data.channelId,
            boardId: data.boardId,
            boardInfo: boardData
        });
    }).catch(function(err) {
        SharedUtils.printError('getDrawBoard.js', 'core', err);
        return null;
        // show alert message ?
    }).nodeify(callback);
};
