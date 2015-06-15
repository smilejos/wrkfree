'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var DrawService = require('../../services/drawService');
var DrawUtils = require('../../../../sharedUtils/drawUtils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: action on client side for update image internally
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, target channel id
 * @param {Number}      data.boardId, target board id
 * @param {String}      data.imgDataUrl, the image data url
 * @param {Array}       data.outdatedDocs, outdated drawRecord docs
 * @param {Function}    callback, callback function
 */
module.exports = function(actionContext, data, callback) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        boardId: SharedUtils.argsCheckAsync(data.boardId, 'number'),
        imgDataUrl: SharedUtils.argsCheckAsync(data.imgDataUrl, 'string'),
        outdatedDocs: SharedUtils.argsCheckAsync(data.outdatedDocs, 'array')
    }).then(function(updateDoc) {
        return actionContext.dispatch('ON_UPDATE_DRAWIMG', updateDoc);
    }).catch(function(err) {
        SharedUtils.printError('updateBaseImage.js', 'core', err);
        return null;
        // show alert message ?
    }).nodeify(callback);
};
