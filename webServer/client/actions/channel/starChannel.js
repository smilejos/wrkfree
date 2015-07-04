'use strict';
var Promise = require('bluebird');
var ChannelService = require('../../services/channelService');
var UserService = require('../../services/userService');
var SharedUtils = require('../../../../sharedUtils/utils');
var ActionUtils = require('../actionUtils');

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
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        toStar: SharedUtils.argsCheckAsync(data.toStar, 'boolean')
    }).then(function(reqData) {
        return ChannelService.starContrlAsync(reqData);
    }).then(function(result) {
        if (!result) {
            throw new Error('star channel control fail');
        }
        ActionUtils.showSuccessEvent('Channel', (data.toStar ? 'star' : 'unstar') + ' channel success');
        return UserService.getInfoAsync(data.host)
            .then(function(info) {
                data.hostInfo = info;
                actionContext.dispatch('UPDATE_CHANNEL_STAR', data);
            });
    }).catch(function(err) {
        SharedUtils.printError('starChannel.js', 'core', err);
        ActionUtils.showErrorEvent('Channel', 'bugs on staring control');
    });
};
