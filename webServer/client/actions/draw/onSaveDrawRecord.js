'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var ActionUtils = require('../actionUtils');
var DrawTempStore = require('../../../shared/stores/DrawTempStore');
var WorkSpaceStore = require('../../../shared/stores/WorkSpaceStore');
var ChannelService = require('../../services/channelService');
var NavToBoard = require('./navToBoard');
// to indicate current tips is showing or not
var TipsShowing = null;

var Configs = require('../../../../configs/config');
// define the maximum number of draws can be lost during client drawing
// NOTE: usually, few missing draws is acceptable under jitter environment.
var MISSING_DRAWS_LIMIT = Configs.get().params.draw.missingDrawLimit;

if (!SharedUtils.isNumber(MISSING_DRAWS_LIMIT)) {
    throw new Error('draw parameters missing');
}


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
        var wkStore = actionContext.getStore(WorkSpaceStore);
        var tempRecord = drawTempStore.getDraws(validData.channelId, validData.boardId, validData.clientId);
        var missingDraws = Math.abs(tempRecord.length - validData.chunksNum);
        if (missingDraws > MISSING_DRAWS_LIMIT) {
            throw new Error('record is broken');
        }
        if (!wkStore.isCurrentUsedBoard(data.channelId, data.boardId)) {
            _showNavigationTips(actionContext, data.channelId, data.boardId);
        }
        return actionContext.dispatch('ON_RECORD_SAVE', {
            channelId: data.channelId,
            boardId: data.boardId,
            clientId: data.clientId,
            record: tempRecord,
            drawOptions: data.drawOptions,
            isUpdated: true
        });
    }).catch(function(err) {
        SharedUtils.printError('onSaveDrawRecord.js', 'core', err);
        ActionUtils.showWarningEvent('WARN', 'remote drawing fail !');
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

/**
 * @Public API
 * @Author: George_Chen
 * @Description: showing information tips when someone drawing on remote side
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      cid, target channel id
 * @param {Number}      bid, target board id
 */
function _showNavigationTips(actionContext, cid, bid) {
    var boardIndex = bid + 1;
    var reqData = {
        channelId: cid
    };
    if (TipsShowing) {
        return;
    }
    TipsShowing = true;
    return ChannelService
        .getInfoAsync(reqData)
        .delay(2000).then(function(info) {
            var title = 'Channel: #' + info.basicInfo.name;
            var msg = 'someone is drawing on board [' + boardIndex + ']';
            TipsShowing = null;
            if (!info.basicInfo.is1on1) {
                ActionUtils.showInfoEvent(title, msg, 'quick open', function(urlNavigator) {
                    actionContext.executeAction(NavToBoard, {
                        urlNavigator: urlNavigator,
                        channelId: cid,
                        boardId: bid
                    });
                });
            }
        });
}
