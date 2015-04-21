'use strict';
var Promise = require('bluebird');
var UserService = require('../../services/userService');
var SharedUtils = require('../../../../sharedUtils/utils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: receive new message coming from server
 *         NOTE: usually triggered by server event
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, target channel of this message
 * @param {String}      data.message, the content of this message
 * @param {String}      data.from, the sender of this message
 * @param {Function}    callback, callback function
 */
module.exports = function(actionContext, data, callback) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        message: SharedUtils.argsCheckAsync(data.message, 'string'),
        from: SharedUtils.argsCheckAsync(data.from, 'md5')
    }).then(function(validMsg) {
        return UserService.getInfoAsync(validMsg.from)
            .then(function(senderInfo) {
                if (!senderInfo) {
                    throw new Error('message sender is invalid');
                }
                validMsg.nickName = senderInfo.nickName;
                validMsg.avatar = senderInfo.avatar;
                return validMsg;
            });
    }).then(function(fullMsg) {
        return actionContext.dispatch('RECV_MESSAGE', fullMsg);
    }).catch(function(err) {
        SharedUtils.printError('recvMessage.js', 'core', err);
        return null;
    }).nodeify(callback);
};
