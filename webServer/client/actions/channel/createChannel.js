'use strict';
var Promise = require('bluebird');
var ChannelService = require('../../services/channelService');
var SharedUtils = require('../../../../sharedUtils/utils');
var OnChannelAdded = require('./onChannelAdded');
var NavToBoard = require('../draw/navToBoard');
var OpenHangout = require('../openHangout');
var WorkSpaceStore = require('../../../shared/stores/WorkSpaceStore');
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
        return Promise.try(function() {
            var wkState = actionContext.getStore(WorkSpaceStore).getState();
            if (wkState.channel.channelId) {
                return actionContext.executeAction(OpenHangout, {
                    channelId: wkState.channel.channelId,
                    hangoutTitle: wkState.channel.name,
                    isforcedToOpen: true
                });
            }
        }).then(function() {
            return actionContext.executeAction(NavToBoard, {
                channelId: info.channelId,
                boardId: 0,
                urlNavigator: data.urlNavigator
            });
        }).then(function() {
            return actionContext.executeAction(OnChannelAdded, info);
        });
    }).catch(function(err) {
        SharedUtils.printError('createChannel.js', 'core', err);
        ActionUtils.showErrorEvent('Channel', 'create channel fail');
        actionContext.dispatch('ON_CHANNEL_CREATE', {
            channelInfo: null
        });
    });
};
