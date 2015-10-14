'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var DrawUtils = require('../../../../sharedUtils/drawUtils');
var DrawService = require('../../services/drawService');
var ActionUtils = require('../actionUtils');
var GetDrawBoard = require('./getDrawBoard');

var SAVE_DRAW_TIMEOUT_IN_MSECOND = 10000;
var LastSaveTime = 0;

/**
 * @Public API
 * @Author: George_Chen
 * @Description: generate the draw record from localDraws and save it
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, target channel id
 * @param {Number}      data.boardId, target board id
 * @param {Number}      data.record, an array of draw chunks
 * @param {Object}      data.drawOptions, the draw related options
 */
module.exports = function(actionContext, data) {
    var currentTime = Date.now();
    if ((currentTime - LastSaveTime) < 30) {
        return ActionUtils.showWarningEvent('WARN', 'repeatedly saving');
    }
    LastSaveTime = currentTime;
    return Promise.props({
        _bid: SharedUtils.argsCheckAsync(data._bid, 'string'),
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        boardId: SharedUtils.argsCheckAsync(data.boardId, 'boardId'),
        record: DrawUtils.checkDrawRecordAsync(data.record),
        drawOptions: SharedUtils.argsCheckAsync(data.drawOptions, 'drawOptions'),
        isUpdated: true
    }).then(function(reqData) {
        return DrawService.saveRecordAsync(reqData)
            .timeout(SAVE_DRAW_TIMEOUT_IN_MSECOND)
            .catch(function() {
                ActionUtils.showWarningEvent('WARN', 'server response timeout');
                throw new Error('timeout error');
            }).then(function(result) {
                if (!result) {
                    throw new Error('save draw record fail');
                }
                reqData.drawOptions = _cloneOptions(reqData.drawOptions);
                return actionContext.dispatch('ON_RECORD_SAVE', reqData);
            }).then(function() {
                return actionContext.dispatch('ON_LOCAL_RECORD_SAVE');
            });
    }).catch(function(err) {
        SharedUtils.printError('saveDrawRecord.js', 'core', err);
        ActionUtils.showWarningEvent('WARN', 'save draw fail');
        actionContext.dispatch('ON_BOARD_CLEAN', data);
        actionContext.executeAction(GetDrawBoard, data);
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
