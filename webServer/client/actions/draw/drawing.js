'use strict';
var Promise = require('bluebird');
var DrawService = require('../../services/drawService');
var SharedUtils = require('../../../../sharedUtils/utils');
var DrawUtils = require('../../../../sharedUtils/drawUtils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: the drawing action on current board
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
        boardId: SharedUtils.argsCheckAsync(data.boardId, 'boardId'),
        chunks: DrawUtils.checkDrawChunksAsync(data.chunks),
        drawOptions: SharedUtils.argsCheckAsync(data.drawOptions, 'drawOptions'),
    }).then(function(recordData) {
        return DrawService.drawAsync(recordData);
    }).then(function(result) {
        if (!result) {
            throw new Error('drawing got failure from server side');
        }
        return actionContext.dispatch('ON_DRAW_CHANGE', data);
    }).catch(function(err) {
        SharedUtils.printError('drawing.js', 'core', err);
        return null;
        // show alert message ?
    }).nodeify(callback);
};
