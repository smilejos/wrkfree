'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var HeaderStore = require('../../../shared/stores/HeaderStore');
var ActionUtils = require('../actionUtils');
var UserService = require('../../services/userService');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: for handling new friend added event
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.uid, friend uid
 * @param {String}      data.group, the group of friend
 * @param {Boolean}     data.isOnline, friend online status
 */
module.exports = function(actionContext, data) {
    var selfInfo = actionContext.getStore(HeaderStore).getSelfInfo();
    return UserService.getInfoAsync(data.uid)
        .then(function(info) {
            return Promise.props({
                uid: SharedUtils.argsCheckAsync(info.uid, 'md5'),
                channelId: SharedUtils.get1on1ChannelId(info.uid, selfInfo.uid),
                avatar: SharedUtils.argsCheckAsync(info.avatar, 'avatar'),
                nickName: SharedUtils.argsCheckAsync(info.nickName, 'nickName'),
                isOnline: SharedUtils.argsCheckAsync(data.isOnline, 'boolean'),
            });
        }).then(function(recvData) {
            actionContext.dispatch('ON_FRIEND_ADDED', recvData);
            ActionUtils.showInfoEvent('Friend', recvData.nickName + ' become your friend');
        }).catch(function(err) {
            SharedUtils.printError('onFriendAdded.js', 'core', err);
            ActionUtils.showErrorEvent('Friend', 'handle new friend added fail');
        });
};
