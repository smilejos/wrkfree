'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var DrawUtils = require('../../../../sharedUtils/drawUtils');
var ActionUtils = require('../actionUtils');
var DrawTempStore = require('../../../shared/stores/DrawTempStore');
var WorkSpaceStore = require('../../../shared/stores/WorkSpaceStore');
var DrawStore = require('../../../shared/stores/DrawStore');
var ChannelService = require('../../services/channelService');
var GetDrawBoard = require('./getDrawBoard');
var NavToBoard = require('./navToBoard');

// to indicate current tips is showing or not
var TipsShowing = null;

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
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        boardId: SharedUtils.argsCheckAsync(data.boardId, 'boardId'),
        record: DrawUtils.checkDrawRecordAsync(data.record),
        drawOptions: SharedUtils.argsCheckAsync(data.drawOptions, 'drawOptions'),
        isUpdated: SharedUtils.argsCheckAsync(data.isUpdated, 'boolean')
    }).then(function(recvData) {
        var drawTempStore = actionContext.getStore(DrawTempStore);
        var drawStore = actionContext.getStore(DrawStore);
        var wkStore = actionContext.getStore(WorkSpaceStore);
        // check to show tips or not
        if (!wkStore.isCurrentUsedBoard(data.channelId, data.boardId)) {
            _showNavigationTips(actionContext, data.channelId, data.boardId);
        } else {
            drawTempStore.saveRemoteRecord(recvData);
        }
        // check target board is polyfilled or not
        if (!drawStore.isPolyFilled(data.channelId, data.boardId)) {
            return actionContext.executeAction(GetDrawBoard, data);
        }
        return actionContext.dispatch('ON_RECORD_SAVE', recvData);
    }).catch(function(err) {
        SharedUtils.printError('onSaveDrawRecord.js', 'core', err);
        var reason = data.reason || 'save draw fail !';
        ActionUtils.showWarningEvent('WARN', 'remote ' + reason);
        actionContext.dispatch('CLEAN_FAILURE_DRAW');
    });
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
