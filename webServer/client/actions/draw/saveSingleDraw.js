'use strict';
var Promise = require('bluebird');
var DrawService = require('../../services/drawService');
var SharedUtils = require('../../../../sharedUtils/utils');
var DrawUtils = require('../../../../sharedUtils/drawUtils');
var ActionUtils = require('../actionUtils');

/**
 * Public API
 * @Author: George_Chen
 * @Description: action for saving single draw point to a draw record
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
        return DrawService.saveSingleDrawAsync(recordData);
    }).then(function(result) {
        if (!result) {
            throw new Error('save single draw fail on server side');
        }
        return actionContext.dispatch('ON_RECORD_SAVE', {
            channelId: data.channelId,
            boardId: data.boardId,
            record: [data.chunks],
            drawOptions: _cloneOptions(data.drawOptions),
            isUpdated: false
        });
    }).catch(function(err) {
        SharedUtils.printError('saveSingleDraw.js', 'core', err);
        ActionUtils.showWarningEvent('Drawing', 'drawing fail');
    });
};

/**
 * @Author: George_Chen
 * @Description: for crate a copy of draw options
 *         NOTE: DrawStore will keep the same reference on draw options
 *               if we do not clone new one. this is will cause abnormal
 *               color duplicated
 * 
 * @param {Object}      options, the draw options
 */
function _cloneOptions(options) {
    var copy = {};
    SharedUtils.fastArrayMap(Object.keys(options), function(prop) {
        copy[prop] = options[prop];
    });
    return copy;
}
