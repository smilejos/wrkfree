'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var DrawService = require('../../services/drawService');
var ActionUtils = require('../actionUtils');

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
        if (data.isInited === true) {
            return DrawService.initToDrawAsync(reqData);
        }
    }).then(function(result) {
        if (result === null) {
            throw new Error('init client draw fail on server side');
        }
        data.clientId = 'local';
        actionContext.dispatch('ON_DRAW_INITED', data);
    }).catch(function(err) {
        SharedUtils.printError('clickToDraw.js', 'core', err);
        ActionUtils.showWarningEvent('Warning', 'can not init drawing mode');
        return null;
    });
};
