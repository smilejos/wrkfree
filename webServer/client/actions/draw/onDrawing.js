'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var DrawUtils = require('../../../../sharedUtils/drawUtils');
var WorkSpaceStore = require('../../../shared/stores/WorkSpaceStore');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: onDrawing action, published by remote client
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, target channel id
 * @param {Number}      data.boardId, target board id
 * @param {Array}       data.chunks, the rawData of draw record
 * @param {Object}      data.drawOptions, the draw related options
 * @param {Function}    callback, callback function
 */
module.exports = function(actionContext, data, callback) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        boardId: SharedUtils.argsCheckAsync(data.boardId, 'number'),
        chunks: DrawUtils.checkDrawChunksAsync(data.chunks),
        drawOptions: SharedUtils.argsCheckAsync(data.drawOptions, 'drawOptions')
    }).then(function(recordData) {
        var workspaceStore = actionContext.getStore(WorkSpaceStore);
        var state = workspaceStore.getState();
        var cid = state.channel.channelId;
        var bid = state.draw.currentBoardId;
        if (cid === data.channelId && bid === data.boardId) {
            return actionContext.dispatch('ON_DRAW_CHANGE', recordData);
        }
        // client and remote drawer use different board, so just send receive event
        return actionContext.dispatch('ON_DRAW_RECEIVE', recordData);
    }).catch(function(err) {
        SharedUtils.printError('drawing.js', 'core', err);
        return null;
        // show alert message ?
    }).nodeify(callback);
};
