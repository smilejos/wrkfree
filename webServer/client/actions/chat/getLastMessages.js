'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../../sharedUtils/utils');
var ChatService = require('../../services/chatService');
var ActionUtils = require('../actionUtils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: pull channel last message on a group of channels
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Array}       data.channels, target channel of this message
 */
module.exports = function(actionContext, data) {
    return Promise.map(data.channels, function(cid) {
        return SharedUtils.argsCheckAsync(cid, 'md5');
    }).then(function(cids) {
        return ChatService.getLastMsgsAsync({
            channels: cids
        });
    }).then(function(result) {
        if (!result) {
            throw new Error('get LastMessage fail');
        }
        return Promise.map(Object.keys(result), function(cid) {
            return {
                lastMessage: result[cid].lastMessage,
                isReaded: result[cid].isReaded
            };
        });
    }).then(function(lastMsgs) {
        actionContext.dispatch('UPDATE_FRIENDS_MESSAGE', {
            msgsData: lastMsgs
        });
    }).catch(function(err) {
        SharedUtils.printError('getLastMessages.js', 'core', err);
        ActionUtils.showWarningEvent('Chat', 'fail to get last message');
    });
};
