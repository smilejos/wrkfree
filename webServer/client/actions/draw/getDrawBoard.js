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
module.exports = function(actionContext, data) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        boardIdx: SharedUtils.argsCheckAsync(data.boardIdx, 'number')
    }).then(function(reqData) {
        return DrawService.getBoardIdAsync(reqData);
    }).then(function(_bid) {
        var drawStore = actionContext.getStore(DrawStore);
        if (!drawStore.isPolyFilled(_bid)) {
            return DrawService.getDrawBoardAsync({
                channelId: data.channelId,
                bid: _bid
            });
        }
        drawStore.setCurrentBoard(_bid);
        return {};
    }).then(function(boardData) {
        if (!boardData.baseImg && !boardData.records) {
            return null;
        }
        return actionContext.dispatch('ON_BOARD_POLYFILL', boardData);
    }).catch(function(err) {
        SharedUtils.printError('getDrawBoard.js', 'core', err);
        return null;
        // show alert message ?
    });
};
