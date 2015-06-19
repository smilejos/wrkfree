'use strict';
var SharedUtils = require('../../../sharedUtils/utils');
var Promise = require('bluebird');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: for user to compress or expand current hangout window
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, the channel id
 * @param {Boolean}     data.isCompressed, to indicate hangout is compressed or not
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        isCompressed: SharedUtils.argsCheckAsync(data.isCompressed, 'boolean')
    }).then(function(reqData) {
        actionContext.dispatch('RESIZE_OPEN_HANGOUT', reqData);
    }).catch(function(err) {
        SharedUtils.printError('resizeHangout.js', 'core', err);
    });
};
