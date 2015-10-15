'use strict';
var Promise = require('bluebird');
var DrawService = require('../../services/drawService');
var SharedUtils = require('../../../../sharedUtils/utils');
var DrawUtils = require('../../../../sharedUtils/drawUtils');
var ActionUtils = require('../actionUtils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: the drawing action on current board
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, target channel id
 * @param {String}      data._bid, target board uuid
 * @param {Array}       data.chunks, the rawData of draw record
 * @param {Object}      data.drawOptions, the draw related options
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        _bid: SharedUtils.argsCheckAsync(data._bid, 'string'),
        chunks: DrawUtils.checkDrawChunksAsync(data.chunks),
        drawOptions: SharedUtils.argsCheckAsync(data.drawOptions, 'drawOptions'),
    }).then(function(reqData) {
        return DrawService.drawAsync(reqData);
    }).then(function(result) {
        if (result ===  null) {
            ActionUtils.showWarningEvent('WARN', 'drawing connectivity slowly');
        }
    }).catch(function(err) {
        SharedUtils.printError('drawing.js', 'core', err);
        ActionUtils.showWarningEvent('WARN', 'drawing abnormal');
    });
};
