'use strict';
var Promise = require('bluebird');
var ChannelService = require('../../services/channelService');
var UserService = require('../../services/userService');
var SharedUtils = require('../../../../sharedUtils/utils');
var ActionUtils = require('../actionUtils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: action for get current channel visitors
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, channel id
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
    }).then(function(reqData) {
        return ChannelService.getVisitorysAsync(reqData);
    }).then(function(visitors) {
        if (visitors === null) {
            throw new Error('get visitors fail on server');
        }
        return Promise.map(visitors, function(uid){
            return UserService.getInfoAsync(uid);
        });
    }).then(function(visitorsInfo){
        return actionContext.dispatch('UPDATE_CHANNEL_VISITORS', {
            channelId: data.channelId,
            visitors: visitorsInfo
        });
    }).catch(function(err) {
        SharedUtils.printError('getVisitorys.js', 'core', err);
        return ActionUtils.showWarningEvent('WARN', 'fail to get channel visitors');
    });
};
