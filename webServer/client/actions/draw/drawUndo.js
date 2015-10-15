'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var DrawService = require('../../services/drawService');
var DrawStore = require('../../../shared/stores/DrawStore');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: action for user to undo to previous draw
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, target channel id
 * @param {String}      data._bid, target board uuid
 * @param {Function}    callback, callback function
 */
module.exports = function(actionContext, data, callback) {
    var _bid = actionContext.getStore(DrawStore)._bid;
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5')
    }).then(function(reqData) {
        reqData._bid = _bid;
        return DrawService.drawUndoAsync(reqData);
    }).then(function(result) {
        if (!result) {
            throw new Error('draw undo error from server side');
        }
        return actionContext.dispatch('ON_DRAW_UNDO', _bid);
    }).catch(function(err) {
        SharedUtils.printError('drawUndo.js', 'core', err);
        return null;
        // show alert message ?
    }).nodeify(callback);
};
