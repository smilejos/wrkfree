'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var DrawUtils = require('../../../../sharedUtils/drawUtils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: for handling the clean draw board action from remote
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, target channel id
 * @param {String}      data._bid, the board uuid
 * @param {Function}    callback, callback function
 */
module.exports = function(actionContext, data, callback) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        _bid: SharedUtils.argsCheckAsync(data._bid, 'string')
    }).then(function(recvData) {
        var cleanDoc = DrawUtils.generateCleanRecord(recvData.channelId, recvData._bid);
        cleanDoc.isUpdated = false;
        return actionContext.dispatch('ON_RECORD_SAVE', cleanDoc);
    }).catch(function(err) {
        SharedUtils.printError('onCleanDrawBoard.js', 'core', err);
        return null;
        // show alert message ?
    }).nodeify(callback);
};
