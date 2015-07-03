'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var UserService = require('../../services/userService');
var HeaderStore = require('../../../shared/stores/HeaderStore');
var ActionUtils = require('../actionUtils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: for handling new channel added event when user create new channel
 *               or permitted to enter another channel
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, the channel id
 * @param {String}      data.name, target channel name
 * @param {String}      data.host, the uid of channel host
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        name: SharedUtils.argsCheckAsync(data.name, 'alphabet'),
        host: SharedUtils.argsCheckAsync(data.host, 'md5')
    }).then(function(recvData) {
        return UserService.getInfoAsync(recvData.host)
            .then(function(hostInfo) {
                var selfInfo = actionContext.getStore(HeaderStore).getSelfInfo();
                recvData.hostInfo = hostInfo;
                recvData.isStarred = (recvData.host === selfInfo.uid);
                recvData.visitTime = Date.now();
                actionContext.dispatch('ON_CHANNEL_ADDED', {
                    channelInfo: recvData
                });
                ActionUtils.showInfoEvent('Channel', 'channel: ' + recvData.name + ' added');
            });
    }).catch(function(err) {
        SharedUtils.printError('onChannelAdded.js', 'core', err);
        ActionUtils.showErrorEvent('Channel', 'handle channel added event fail');
    });
};
