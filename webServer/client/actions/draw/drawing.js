'use strict';
var Promise = require('bluebird');
var DrawService = require('../../services/drawService');
var SharedUtils = require('../../../../sharedUtils/utils');
var DrawUtils = require('../../../../sharedUtils/drawUtils');
var DrawTempStore = require('../../../shared/stores/DrawTempStore');
var ActionUtils = require('../actionUtils');

/**
 * load configs
 */
var Configs = require('../../../../configs/config');
var ACTIVED_DRAWS_LIMIT = Configs.get().params.draw.activeDrawsLimit;

if (!SharedUtils.isNumber(ACTIVED_DRAWS_LIMIT)) {
    throw new Error('error while on getting draw related params');
}

var WARNING_DRAWS_LIMIT = (ACTIVED_DRAWS_LIMIT / 2);

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
        var tempStore = actionContext.getStore(DrawTempStore);
        var draws = tempStore.getLocalDraws(data.channelId, data.boardId);
        if (draws && draws.length === (ACTIVED_DRAWS_LIMIT - 1)) {
            ActionUtils.showErrorEvent('Drawing', 'stop drawing');
        } else if (draws && draws.length === WARNING_DRAWS_LIMIT) {
            ActionUtils.showWarningEvent('Drawing', 'Too many draws at the same time');
        }
        data.clientId = 'local';
        tempStore.saveDrawChange(data);
        return DrawService.drawAsync(recordData);
    }).then(function(result) {
        if (!result) {
            throw new Error('drawing got failure from server side');
        }
    }).catch(function(err) {
        SharedUtils.printError('drawing.js', 'core', err);
        ActionUtils.showErrorEvent('Drawing', 'current draws abnormal');
    }).nodeify(callback);
};
