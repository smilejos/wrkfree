'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var DrawService = require('../../services/drawService');
var DrawUtils = require('../../../../sharedUtils/drawUtils');
var ActionUtils = require('../actionUtils');
var DrawStore = require('../../../shared/stores/DrawStore');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: action for user to clean current draw board
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, target channel id
 */
module.exports = function(actionContext, data) {
    var _bid = actionContext.getStore(DrawStore)._bid;
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5')
    }).then(function(reqData) {
        reqData._bid = _bid;
        return DrawService.cleanDrawBoardAsync(reqData);
    }).then(function(result) {
        if (!result) {
            throw new Error('clean draw board fail from server side');
        }
        var cleanDoc = DrawUtils.generateCleanRecord(data.channelId, _bid);
        cleanDoc.isUpdated = false;
        return actionContext.dispatch('ON_RECORD_SAVE', cleanDoc);
    }).catch(function(err) {
        SharedUtils.printError('cleanDrawBoard.js', 'core', err);
        ActionUtils.showWarningEvent('WARN', 'fail to clean on current board');
    });
};
