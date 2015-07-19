'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var DrawTempStore = require('../../../shared/stores/DrawTempStore');
var GetDrawBoardAction = require('./getDrawBoard');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: save the draw record when remote client published saveDrawRecord
 *         NOTE: current client should check the number of draw chunks is 
 *               the same as remote publisher.
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, target channel id
 * @param {Number}      data.boardId, target board id
 * @param {Number}      data.chunksNum, number of chunks in current record
 * @param {Object}      data.drawOptions, the draw related options
 * @param {Function}    callback, callback function
 */
module.exports = function(actionContext, data, callback) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        boardId: SharedUtils.argsCheckAsync(data.boardId, 'boardId'),
        clientId: SharedUtils.argsCheckAsync(data.clientId, 'string'),
        chunksNum: SharedUtils.argsCheckAsync(data.chunksNum, 'number'),
        drawOptions: SharedUtils.argsCheckAsync(data.drawOptions, 'drawOptions')
    }).then(function(validData) {
        var drawTempStore = actionContext.getStore(DrawTempStore);
        var tempRecord = drawTempStore.getDraws(validData.channelId, validData.boardId, validData.clientId);
        if (tempRecord.length !== validData.chunksNum) {
            throw new Error('record is broken');
        }
        return actionContext.dispatch('ON_RECORD_SAVE', {
            channelId: data.channelId,
            boardId: data.boardId,
            record: tempRecord,
            drawOptions: data.drawOptions
        });
    }).catch(function(err) {
        SharedUtils.printError('onSaveDrawRecord.js', 'core', err);
        // TODO:
        // what if channel id and board id is null ?
        actionContext.dispatch('CLEAN_FAILURE_DRAW', {
            channelId: data.channelId,
            boardId: data.boardId,
            clientId: data.clientId
        });
        return null;
    }).nodeify(callback);
};
