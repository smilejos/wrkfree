'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var DrawService = require('../../services/drawService');
var DrawTempStore = require('../../../shared/stores/DrawTempStore');
var GetDrawBoardAction = require('./getDrawBoard');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: generate the draw record from draw chunks stored on drawTempStore
 *         NOTE: chunksNum is used to notify server that how many chunks
 *               that store on client side.
 *               server should reply "true" if chunksNum is the same on both
 *               client and server side
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, target channel id
 * @param {Number}      data.boardId, target board id
 * @param {Number}      data.chunksNum, number of chunks in current record
 * @param {Object}      data.drawOptions, the draw related options
 * @param {Function}    callback, callback function
 */
module.exports = function(actionContext, data, callback) {
    var clientId = 'local';
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        boardId: SharedUtils.argsCheckAsync(data.boardId, 'boardId'),
        chunksNum: SharedUtils.argsCheckAsync(data.chunksNum, 'number'),
        drawOptions: SharedUtils.argsCheckAsync(data.drawOptions, 'drawOptions')
    }).then(function(validData) {
        return DrawService.saveRecordAsync(validData);
    }).then(function(result) {
        if (!result) {
            throw new Error('save draw record fail');
        }
        var drawTempStore = actionContext.getStore(DrawTempStore);
        return actionContext.dispatch('ON_RECORD_SAVE', {
            channelId: data.channelId,
            boardId: data.boardId,
            clientId: clientId,
            record: drawTempStore.getLocalDraws(data.channelId, data.boardId),
            drawOptions: _cloneOptions(data.drawOptions)
        });
    }).catch(function(err) {
        SharedUtils.printError('saveDrawRecord.js', 'core', err);
        actionContext.dispatch('CLEAN_FAILURE_DRAW', {
            channelId: data.channelId,
            boardId: data.boardId,
            clientId: clientId
        });
        return null;
        // show alert message ?
    }).nodeify(callback);
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
