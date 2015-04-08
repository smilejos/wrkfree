'use strict';
var PrivateBoxesStore = require('../../shared/stores/privateBoxesStore');
var UserInfoStore = require('../../shared/stores/userInfoStore');
var MsgService = require('../services/msgService');
var SharedUtils = require('../../../sharedUtils/utils');
// TODO: remove it later
var Promise = require('bluebird');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: trigger an private msgbox open action
 *
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      channelId, channel's id
 * @param {Function}    callback, callback function
 */
module.exports = function(actionContext, channelId, callback) {
    var msgStore = actionContext.getStore(PrivateBoxesStore);
    return SharedUtils.argsCheckAsync(channelId, 'md5')
        .then(function(chId) {
            return msgStore.getLocalMsgsAsync(chId).then(function(localMsgs) {
                if (SharedUtils.isEmptyArray(localMsgs)) {
                    return _fetchMsgsAsync(actionContext, chId);
                }
                return _dispatchEvent(actionContext, chId, []);
            });
        }).nodeify(callback);
};

/**
 * @Author: George_Chen
 * @Description: fetch the latest msgs from server
 *
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      chId, an valid channel's id
 */
function _fetchMsgsAsync(actionContext, chId) {
    var userStore = actionContext.getStore(UserInfoStore);
    // return MsgService.getPrevMsgs(chId).map(function(rawMsg) {
    // TODO: should be replaced by above line
    return Promise.map(Data[chId], function(rawMsg){
            return userStore.getUserAsync(rawMsg.sender).then(function(info) {
                rawMsg.avatar = info.avatar;
                // no private channel created for "self" and "self", so the "channelId" will be null
                rawMsg.sender = (!info.channelId ? 'self' : rawMsg.sender);
                return rawMsg;
            });
        }).then(function(latestMsgs) {
            return _dispatchEvent(actionContext, chId, latestMsgs);
        });
}

/**
 * @Author: George_Chen
 * @Description: dispatch an 'UPDATE_PRIVATE_MSGBOX' event to listener
 *
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      chId, an valid channel's id
 * @param {Array}       msgs, an array of msgs will be sent to update the msgBox
 */
function _dispatchEvent(actionContext, chId, msgs) {
    var channelMsgs = {};
    channelMsgs.channelId = chId;
    channelMsgs.msgs = msgs;
    return actionContext.dispatch('UPDATE_PRIVATE_MSGBOX', channelMsgs);
}

// TODO: should be removed
var Data = {
    '5e2e717e84acd6518bbcd43570742d3f': [{
                sender: 'bamoo456@gmail.com',
                channelId: '5e2e717e84acd6518bbcd43570742d3f',
                contents: 'Hi this is the 1st test msg, how do u feel ? is that good ?',
                timestamp: new Date('January 1, 2015  09:20:00').getTime()
            },
            {
                sender: 'bamoo789@gmail.com',
                channelId: '5e2e717e84acd6518bbcd43570742d3f',
                contents: 'i am the 2nd one',
                timestamp: new Date('January 2, 2015  10:05:00').getTime()
            },
            {
                sender: 'bamoo789@gmail.com',
                channelId: '5e2e717e84acd6518bbcd43570742d3f',
                contents: 'i am the 3rd one',
                timestamp: new Date('January 3, 2015  20:30:00').getTime()
            }],

    '5e2e717e84acd6518bbcd43570742d3c': [{
                sender: 'bamoo456@gmail.com',
                channelId: '5e2e717e84acd6518bbcd43570742d3c',
                contents: 'im another channel 1st',
                timestamp: new Date('January 1, 2015  09:20:00').getTime()
            },
            {
                sender: 'bamoo789@gmail.com',
                channelId: '5e2e717e84acd6518bbcd43570742d3c',
                contents: 'i am the 2nd one',
                timestamp: new Date('January 2, 2015  10:05:00').getTime()
            },
            {
                sender: 'bamoo789@gmail.com',
                channelId: '5e2e717e84acd6518bbcd43570742d3c',
                contents: 'i am the 3rd one',
                timestamp: new Date('January 3, 2015  20:30:00').getTime()
            }]
};