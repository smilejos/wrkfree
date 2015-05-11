'use strict';
var Promise = require('bluebird');
var ChannelService = require('../../services/channelService');
var SharedUtils = require('../../../../sharedUtils/utils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: action for channel create 
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.name, target channel name
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        name: SharedUtils.argsCheckAsync(data.name, 'string'),
    }).then(function(reqData) {
        return ChannelService.createAsync(reqData);
    }).then(function(result) {
        if (!result) {
            throw new Error('create channel fail');
        }
        actionContext.dispatch('ON_CHANNEL_CREATE', {
            channelInfo: result
        });
    }).catch(function(err) {
        SharedUtils.printError('createChannel.js', 'core', err);
        actionContext.dispatch('ON_CHANNEL_CREATE', {
            channelInfo: null
        });
    });
};
