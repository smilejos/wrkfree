'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');
var ActionUtils = require('./actionUtils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: for user to update the hangout focused state
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, the channel id
 * @param {Boolean}     data.onFocused, focus state on hangout input
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        onFocused: SharedUtils.argsCheckAsync(data.onFocused, 'boolean')
    }).then(function(reqData) {
        actionContext.dispatch('UPDATE_HANGOUT_FOCUS', reqData);
    }).catch(function(err) {
        SharedUtils.printError('focusHangout.js', 'core', err);
        ActionUtils.showErrorEvent('Hangout', 'focus hangout input area fail');
    });
};
