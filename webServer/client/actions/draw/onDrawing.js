'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var DrawUtils = require('../../../../sharedUtils/drawUtils');
var DrawStore = require('../../../shared/stores/DrawStore');
var DrawTempStore = require('../../../shared/stores/DrawTempStore');
var ActionUtils = require('../actionUtils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: onDrawing action, published by remote client
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
        drawOptions: SharedUtils.argsCheckAsync(data.drawOptions, 'drawOptions')
    }).then(function(recvData) {
        var drawStore = actionContext.getStore(DrawStore);
        var tempStore = actionContext.getStore(DrawTempStore);
        if (drawStore._bid === recvData._bid) {
            return tempStore.saveRemoteDraws(recvData);
        }
    }).catch(function(err) {
        SharedUtils.printError('onDrawing.js', 'core', err);
        ActionUtils.showErrorEvent('Drawing', 'remote drawing abnormal');
    });
};
