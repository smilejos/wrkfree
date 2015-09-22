'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var ChatService = require('../../services/chatService');
var ChatUtils = require('./chatUtils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: send the chat message to specific channel
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, target channel of this message
 * @param {String}      data.message, the content of this message
 * @param {String}      data.from, the sender of this message
 * @param {Function}    callback, callback function
 */
module.exports = function(actionContext, data, callback) {
    if (data instanceof Object && data.message === '') {
        return (SharedUtils.isFunction(callback) ? callback() : null);
    }
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        message: SharedUtils.argsCheckAsync(data.message, 'string'),
        from: SharedUtils.argsCheckAsync(data.from, 'md5')
    }).then(function(validMsg) {
        return ChatService.sendMsgAsync(validMsg);
    }).then(function(result) {
        if (!result) {
            throw new Error('server response error');
        }
        data.sentTime = result.sentTime;
        return ChatUtils.fillUserInfo(data);
    }).then(function(fullMsg) {
        return actionContext.dispatch('RECV_MESSAGE', fullMsg);
    }).catch(function(err) {
        SharedUtils.printError('sendMessage.js', 'core', err);
        return null;
        // show alert message ?
    }).nodeify(callback);
};
