'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');
var ActionUtils = require('./actionUtils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: for user to update the current hangout should twinkled or not
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, the channel id
 * @param {Boolean}     data.isTwinkled, indicate hangout is twinkled or not
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        isTwinkled: SharedUtils.argsCheckAsync(data.isTwinkled, 'boolean')
    }).then(function(reqData) {
        actionContext.dispatch('UPDATE_HANGOUT_TWINKLE', reqData);
    }).catch(function(err) {
        SharedUtils.printError('updateHangoutTwinkle.js', 'core', err);
        ActionUtils.showErrorEvent('Hangout', 'update hangout twinkle state fail');
    });
};
