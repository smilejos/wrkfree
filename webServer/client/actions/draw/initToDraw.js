'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var DrawService = require('../../services/drawService');
var ActionUtils = require('../actionUtils');
var WorkSpaceStore = require('../../../shared/stores/WorkSpaceStore');

var REQUEST_TIMEOUT_IN_MSECOND = 1000;

/**
 * @Public API
 * @Author: George_Chen
 * @Description: this action is used to initialize draw resource both on
 *               client and server side 
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, target channel id
 * @param {Number}      data.boardId, target board id
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        boardId: SharedUtils.argsCheckAsync(data.boardId, 'number')
    }).then(function(reqData) {
        return DrawService.initToDrawAsync(reqData)
            .timeout(REQUEST_TIMEOUT_IN_MSECOND).then(function(result) {
                if (result === null) {
                    data.isInited = false;
                    actionContext.dispatch('ON_DRAW_INITED', data);
                    actionContext.dispatch('CLEAN_FAILURE_DRAW', data);
                }
            });
    }).catch(function(err) {
        SharedUtils.printError('initToDraw.js', 'core', err);
        ActionUtils.showWarningEvent('Warning', 'can not init drawing mode');
        return null;
    });
};
