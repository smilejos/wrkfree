'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var ChatService = require('../../services/chatService');
var ChatUtils = require('./chatUtils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: pull previous channel messages
 *         NOTE: use data.period can decide which messages will be pulled
 *               based on duration.
 *               data.period.start, the start timestamp of period
 *               data.period.end, the end timestamp of period
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, target channel of this message
 * @param {Object}      data.period, messages period, [optional]
 * @param {Function}    callback, callback function
 */
module.exports = function(actionContext, data, callback) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(data.channelId, 'md5'),
        period: data.period,
    }).then(function(data) {
        return ChatService.getChannelMsgAsync(data);
    }).map(function(msgDoc) {
        return ChatUtils.fillUserInfo(msgDoc);
    }).then(function(messages) {
        if (messages.length > 0) {
            actionContext.dispatch('PULL_MESSAGES', messages);
        }
    }).catch(function(err) {
        SharedUtils.printError('pullMessage.js', 'core', err);
        return null;
        // show alert message ?
    }).nodeify(callback);
};
