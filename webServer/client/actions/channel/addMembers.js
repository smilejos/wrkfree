'use strict';
var Promise = require('bluebird');
var ChannelService = require('../../services/channelService');
var SharedUtils = require('../../../../sharedUtils/utils');
var ActionUtils = require('../actionUtils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: action for host to add channel members
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, channel id
 * @param {Array}       data.members, an array of member uids
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        members: Promise.map(data.members, function(uid) {
            return SharedUtils.argsCheckAsync(uid, 'md5');
        })
    }).then(function(reqData) {
        return ChannelService.addMembersAsync(reqData);
    }).then(function(recvData) {
        var hasError = false;
        SharedUtils.fastArrayMap(recvData, function(result) {
            if (result === null) {
                hasError = true;
            }
        });
        if (hasError) {
            ActionUtils.showWarningEvent('WARN', 'some candidate not successfully added');
        } else {
            ActionUtils.showSuccessEvent('SUCCESS', 'successfully invite new members');
        }
        actionContext.dispatch('TOGGLE_CHANNEL_INVITATION', {
            isActive: false
        });
    }).catch(function(err) {
        SharedUtils.printError('addMembers.js', 'core', err);
        return ActionUtils.showWarningEvent('WARN', 'fail to add channel members');
    });
};
