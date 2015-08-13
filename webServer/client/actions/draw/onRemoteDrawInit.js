'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var ActionUtils = require('../actionUtils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: catch the event that remote client is about to drawing
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, target channel id
 * @param {Number}      data.boardId, target board id
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        boardId: SharedUtils.argsCheckAsync(data.boardId, 'number'),
        clientId: SharedUtils.argsCheckAsync(data.clientId, 'string'),
    }).then(function(recvData) {
        actionContext.dispatch('ON_DRAW_INITED', recvData);
    }).catch(function(err) {
        SharedUtils.printError('onRemoteDrawInit.js', 'core', err);
        ActionUtils.showWarningEvent('Warning', 'abnormal infomration from remote');
    });
};
