'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');
var DrawService = require('../services/drawService');
var NavToBoard = require('./draw/navToBoard');
var ActionUtils = require('./actionUtils');
var CloseHangout = require('./closeHangout');
var HangoutStore = require('../../shared/stores/HangoutStore');


/**
 * @Public API
 * @Author: George_Chen
 * @Description: find the latest updated board, and navigate to this 
 *               workspace board
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, the channel id
 * @param {Number}      data.boardId, target board id
 * @param {Function}    data.urlNavigator, the transitionTo reference of react-router
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5')
    }).then(function(reqData) {
        return DrawService.getLatestBoardIdAsync(reqData);
    }).then(function(latestBoardId) {
        if (!SharedUtils.isFunction(data.urlNavigator)) {
            throw new Error('arguments incorrect');
        }
        actionContext.executeAction(NavToBoard, {
            urlNavigator: data.urlNavigator,
            channelId: data.channelId,
            boardId: latestBoardId
        });
    }).then(function(){
        var hangoutStore = actionContext.getStore(HangoutStore);
        if (hangoutStore.isHangoutExist(data.channelId)) {
            actionContext.executeAction(CloseHangout, {
                channelId: data.channelId,
                isStayed: true
            });
        }
    }).catch(function(err) {
        SharedUtils.printError('enterWorkspace.js', 'core', err);
        ActionUtils.showErrorEvent('Channel', err.toString());
    });
};
