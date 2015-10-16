'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var DrawService = require('../../services/drawService');
var WorkSpaceStore = require('../../../shared/stores/WorkSpaceStore');
var ChannelVisitorStore = require('../../../shared/stores/ChannelVisitorStore');
var DrawStore = require('../../../shared/stores/DrawStore');
var ActionUtils = require('../actionUtils');
var NavToBoard = require('./navToBoard');
var GetDrawBoard = require('./getDrawBoard');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: action for host to delete draw board
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, target channel id
 * @param {Function}    data.urlNavigator, the transitionTo reference of react-router
 */
module.exports = function(actionContext, data) {
    var _bid = actionContext.getStore(DrawStore)._bid;
    var wkState = actionContext.getStore(WorkSpaceStore).getState();
    var visitorStore = actionContext.getStore(ChannelVisitorStore);
    if (!wkState.status.isHost) {
        return ActionUtils.showWarningEvent('WARN', 'only channel host can delete board !');
    }
    if (visitorStore.getVisitors(data.channelId).length > 1) {
        return ActionUtils.showWarningEvent('WARN', 'please ensure no other visitors in the channel now!');
    }
    if (wkState.draw.boardNums < 2) {
        return ActionUtils.showWarningEvent('WARN', 'workspace must keep at least one board');
    }
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5')
    }).then(function(reqData) {
        reqData._bid = _bid;
        return DrawService.delBoardAsync(reqData);
    }).then(function(result) {
        if (!result) {
            throw new Error('board delete error from server side');
        }
        return actionContext.dispatch('ON_BOARD_DEL', _bid);
    }).then(function() {
        var currentBoardIdx = wkState.draw.currentBoardIdx;
        if (currentBoardIdx === 0) {
            actionContext.executeAction(GetDrawBoard, {
                channelId: data.channelId,
                boardIdx: currentBoardIdx
            });
        } else {
            actionContext.executeAction(NavToBoard, {
                urlNavigator: data.urlNavigator,
                channelId: data.channelId,
                boardIdx: currentBoardIdx - 1
            });
        }
    }).catch(function(err) {
        SharedUtils.printError('delDrawBoard.js', 'core', err);
        ActionUtils.showWarningEvent('WARN', 'unexpected error on deleting board');
    });
};
