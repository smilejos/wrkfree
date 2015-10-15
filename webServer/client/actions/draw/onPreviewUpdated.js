'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var ActionUtils = require('../actionUtils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: for handling remote event that draw board preview has been updated
 *
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, the channel id
 * @param {String}      data._bid, the board uuid
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        _bid: SharedUtils.argsCheckAsync(data._bid, 'string')
    }).then(function(recvData) {
        actionContext.dispatch('ON_PREVIEW_UPDATED', recvData);
    }).catch(function(err) {
        SharedUtils.printError('onPreviewUpdated.js', 'core', err);
        ActionUtils.showErrorEvent('Draw', 'update board preview image fail');
    });
};
