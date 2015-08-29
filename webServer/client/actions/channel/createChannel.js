'use strict';
var Promise = require('bluebird');
var ChannelService = require('../../services/channelService');
var SharedUtils = require('../../../../sharedUtils/utils');
var OnChannelAdded = require('./onChannelAdded');
var NavToBoard = require('../draw/navToBoard');
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
        name: SharedUtils.argsCheckAsync(data.name, 'channelName'),
    }).then(function(reqData) {
        return ChannelService.createAsync(reqData);
    }).then(function(info) {
        if (!info) {
            throw new Error('create channel fail');
        }
        actionContext.executeAction(NavToBoard, {
            channelId: info.channelId,
            boardId: 0,
            urlNavigator: data.urlNavigator
        });
        return info;
    }).then(function(channelInfo) {
        actionContext.executeAction(OnChannelAdded, channelInfo);
    }).catch(function(err) {
        SharedUtils.printError('createChannel.js', 'core', err);
        ActionUtils.showErrorEvent('Channel', 'create channel fail');
        actionContext.dispatch('ON_CHANNEL_CREATE', {
            channelInfo: null
        });
    });
};
