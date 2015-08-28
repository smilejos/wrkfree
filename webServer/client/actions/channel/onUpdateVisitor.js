'use strict';
var Promise = require('bluebird');
var ChannelService = require('../../services/channelService');
var UserService = require('../../services/userService');
var SharedUtils = require('../../../../sharedUtils/utils');
var ActionUtils = require('../actionUtils');
var HeaderStore = require('../../../shared/stores/HeaderStore');
var ChannelVisitorStore = require('../../../shared/stores/ChannelVisitorStore');


/**
 * @Public API
 * @Author: George_Chen
 * @Description: action for updating specific channel visitor list
 * 
 * @param {Object}        actionContext, the fluxible's action context
 * @param {String}        data.uid, the visitor uid
 * @param {String}        data.channelId, the visited channel id
 * @param {String}        data.isVisited, check currently is visit or not
 */
module.exports = function(actionContext, data) {
    return Promise.join(
        SharedUtils.argsCheckAsync(data.uid, 'md5'),
        SharedUtils.argsCheckAsync(data.isVisited, 'boolean'),
        SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        function(uid, isVisited) {
            return (isVisited ? UserService.getInfoAsync(uid) : null);
        }).then(function(targetInfo) {
            var selfUid = actionContext.getStore(HeaderStore).getSelfInfo().uid;
            var visitorStore = actionContext.getStore(ChannelVisitorStore);
            var storeEvt = (data.isVisited ? 'ON_CHANNEL_VISITOR_ADD' : 'ON_CHANNEL_VISITOR_REMOVE');
            if (selfUid === data.uid && !data.isVisited) {
                data.isVisited = true;
                return ChannelService.keepVisitorAsync(data);
            }
            if (data.isVisited && visitorStore.hasVisited(data.channelId, data.uid) === false) {
                ActionUtils.showInfoEvent('INFO', 'user [' + targetInfo.nickName + '] enter channel');
            }
            actionContext.dispatch(storeEvt, {
                channelId: data.channelId,
                uid: data.uid,
                visitorInfo: targetInfo
            });
        }).catch(function(err) {
            SharedUtils.printError('onUpdateVisitor.js', 'core', err);
            return ActionUtils.showErrorEvent('ERROR', 'channel visitor information abnormal');
        });
};
