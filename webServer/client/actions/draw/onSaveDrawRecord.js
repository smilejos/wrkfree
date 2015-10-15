'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var DrawUtils = require('../../../../sharedUtils/drawUtils');
var ActionUtils = require('../actionUtils');
var DrawTempStore = require('../../../shared/stores/DrawTempStore');
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
 * @param {Number}      data.boardIdx, target board index
 * @param {Number}      data.chunksNum, number of chunks in current record
 * @param {Object}      data.drawOptions, the draw related options
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        _bid: SharedUtils.argsCheckAsync(data._bid, 'string'),
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        boardIdx: SharedUtils.argsCheckAsync(data.boardIdx, 'number'),
        record: DrawUtils.checkDrawRecordAsync(data.record),
        drawOptions: SharedUtils.argsCheckAsync(data.drawOptions, 'drawOptions'),
        isUpdated: SharedUtils.argsCheckAsync(data.isUpdated, 'boolean')
    }).then(function(recvData) {
        var drawTempStore = actionContext.getStore(DrawTempStore);
        var drawStore = actionContext.getStore(DrawStore);
        // check to show tips or not
        if (drawStore._bid !== recvData._bid) {
            _showNavigationTips(actionContext, data.channelId, data.boardIdx);
        } else {
            drawTempStore.saveRemoteRecord(recvData);
        }
        // check target board is polyfilled or not
        if (!drawStore.isPolyFilled(recvData._bid)) {
            return actionContext.executeAction(GetDrawBoard, data);
        }
        return actionContext.dispatch('ON_RECORD_SAVE', recvData);
    }).catch(function(err) {
        var reason = data.reason || 'save draw fail !';
        SharedUtils.printError('onSaveDrawRecord.js', 'core', err);
        ActionUtils.showWarningEvent('WARN', 'remote ' + reason);
        actionContext.dispatch('ON_BOARD_CLEAN', data);
        actionContext.executeAction(GetDrawBoard, data);
    });
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: showing information tips when someone drawing on remote side
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      cid, target channel id
 * @param {Number}      idx, target board index
 */
function _showNavigationTips(actionContext, cid, idx) {
    var boardPage = idx + 1;
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
            var msg = 'someone is drawing on board [' + boardPage + ']';
            TipsShowing = null;
            if (!info.basicInfo.is1on1) {
                ActionUtils.showInfoEvent(title, msg, 'quick open', function(urlNavigator) {
                    actionContext.executeAction(NavToBoard, {
                        urlNavigator: urlNavigator,
                        channelId: cid,
                        boardIdx: idx
                    });
                });
            }
        });
}
