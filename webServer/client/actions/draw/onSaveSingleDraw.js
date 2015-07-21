'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var DrawUtils = require('../../../../sharedUtils/drawUtils');
var ActionUtils = require('../actionUtils');

/**
 * Public API
 * @Author: George_Chen
 * @Description: for saving single drawing point record 
 *       
 * @param {String}          data.channelId, the channel id
 * @param {Number}          data.boardId, the draw board id
 * @param {Array}           data.chunks, the raw chunks of current drawing
 * @param {Object}          data.drawOptions, the draw options for this record
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        boardId: SharedUtils.argsCheckAsync(data.boardId, 'boardId'),
        chunks: DrawUtils.checkDrawChunksAsync(data.chunks),
        drawOptions: SharedUtils.argsCheckAsync(data.drawOptions, 'drawOptions'),
    }).then(function(recordData) {
        if (!recordData) {
            throw new Error('broken draw record');
        }
        return actionContext.dispatch('ON_RECORD_SAVE', {
            channelId: recordData.channelId,
            boardId: recordData.boardId,
            record: [recordData.chunks],
            drawOptions: recordData.drawOptions
        });
    }).catch(function(err) {
        SharedUtils.printError('onSaveSingleDraw.js', 'core', err);
        ActionUtils.showWarningEvent('Drawing', 'remote drawing fail');
    });
};
