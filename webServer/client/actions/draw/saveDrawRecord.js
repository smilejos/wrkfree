'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var DrawService = require('../../services/drawService');
var ActionUtils = require('../actionUtils');
var GetDrawBoard = require('./getDrawBoard');

var IsTriggered = false;
var SAVE_DRAW_TIMEOUT_IN_MSECOND = 1000;

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
module.exports = function(actionContext, data) {
    if (IsTriggered) {
        return ActionUtils.showWarningEvent('WARN', 'repeatly save draw record');
    }
    var clientId = 'local';
    IsTriggered = true;
    return Promise.join(
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        SharedUtils.argsCheckAsync(data.boardId, 'boardId'),
        SharedUtils.argsCheckAsync(data.localDraws, 'array'),
        SharedUtils.argsCheckAsync(data.drawOptions, 'drawOptions'),
        function(cid, bid, draws, options) {
            actionContext.dispatch('CLEAN_LOCAL_DRAW', {
                channelId: cid,
                boardId: bid
            });
            return Promise.delay(50).then(function() {
                return DrawService.saveRecordAsync({
                    channelId: cid,
                    boardId: bid,
                    chunksNum: draws.length,
                    drawOptions: options
                });
            }).timeout(SAVE_DRAW_TIMEOUT_IN_MSECOND).then(function(result) {
                if (!result) {
                    throw new Error('save draw record fail');
                }
                IsTriggered = false;
                return actionContext.dispatch('ON_RECORD_SAVE', {
                    channelId: data.channelId,
                    boardId: data.boardId,
                    clientId: clientId,
                    record: data.localDraws,
                    drawOptions: _cloneOptions(data.drawOptions),
                    isUpdated: true
                });
            }).catch(function() {
                ActionUtils.showWarningEvent('WARN', 'server response timeout');
                IsTriggered = false;
                actionContext.dispatch('ON_BOARD_CLEAN', data);
                actionContext.executeAction(GetDrawBoard, data);
            });
        }).catch(function(err) {
            IsTriggered = false;
            SharedUtils.printError('saveDrawRecord.js', 'core', err);
            ActionUtils.showWarningEvent('WARN', 'save draw fail');
            actionContext.dispatch('CLEAN_FAILURE_DRAW', {
                channelId: data.channelId,
                boardId: data.boardId,
                clientId: clientId
            });
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
