'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var DrawService = require('../../services/drawService');
var ActionUtils = require('../actionUtils');

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
        data.clientId = 'local';
        if (data.isInited === true) {
            _sendInitRequest(actionContext, reqData, data);
        }
        return Promise.delay(50).then(function() {
            actionContext.dispatch('ON_DRAW_INITED', data);
        });
    }).catch(function(err) {
        SharedUtils.printError('initToDraw.js', 'core', err);
        ActionUtils.showWarningEvent('Warning', 'can not init drawing mode');
        return null;
    });
};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: send draw init request to initialize user related resource
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Object}      reqData, the req data object
 * @param {Object}      data, the original data object
 */
function _sendInitRequest(actionContext, reqData, originData) {
    return DrawService.initToDrawAsync(reqData)
        .timeout(REQUEST_TIMEOUT_IN_MSECOND).then(function(result) {
            if (result === null) {
                originData.isInited = false;
                actionContext.dispatch('ON_DRAW_INITED', originData);
                actionContext.dispatch('CLEAN_FAILURE_DRAW', originData);
            }
        }).catch(function(err) {
            console.error('initToDraw: ', err);
            ActionUtils.showWarningEvent('Warning', 'can not init drawing mode');
        });
}
