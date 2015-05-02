'use strict';
var SharedUtils = require('../../sharedUtils/utils');
var Promise = require('bluebird');
var MsgDao = require('../daos/MsgDao');
var ChannelMemberDao = require('../daos/ChannelMemberDao');
var ChannelStoreage = require('./ChannelService');

/************************************************
 *
 *           Public APIs
 *
 ************************************************/

/**
 * Public API
 * @Author: George_Chen
 * @Description: save new chat message and update message read status
 *             
 * @param {String}          sender, sender uid
 * @param {String}          channelId, channel id
 * @param {String}          msg, message content
 */
exports.saveAsync = function(sender, channelId, msg) {
    return _ensureAuth(sender, channelId).then(function() {
        return MsgDao.saveMsgAsync(sender, channelId, msg);
    }).then(function(result) {
        if (!result) {
            throw new Error('db save fail');
        }
        return ChannelMemberDao.updateMsgAsync(sender, channelId);
    }).catch(function(err) {
        SharedUtils.printError('msgService.js', 'saveAsync', err);
        return null;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to pull specific channel's message
 *
 * @param {String}          user, user's uid
 * @param {String}          channelId, channel id
 * @param {Object}          timePeriod, the query time period
 *                          timePeriod.start, the start time of this period
 *                          timePeriod.end, the end time of this period
 */
exports.pullAsync = function(user, channelId, timePeriod) {
    return Promise.props({
        messages: MsgDao.findByChannelAsync(channelId, timePeriod),
        isAuth: _ensureAuth(user, channelId)
    }).then(function(data) {
        ChannelMemberDao.updateMsgAsync(user, channelId);
        return Promise.map(data.messages, function(msgDoc) {
            var time = msgDoc.sentTime.toString();
            msgDoc.sentTime = new Date(time).getTime();
            return msgDoc;
        });
    }).catch(function(err) {
        SharedUtils.printError('msgService.js', 'pullAsync', err);
        return null;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to find the latest message on a group of channels
 *
 * @param {String}          user, user uid
 * @param {Array}           channels, an array of channelIds
 */
exports.getLatestAsync = function(user, channels) {
    return Promise.map(channels, function(channelId) {
        return _ensureAuth(user, channelId);
    }).then(function() {
        return MsgDao.findChannelsLatestAsync(channels);
    }).catch(function(err) {
        SharedUtils.printError('msgService.js', 'getLatestAsync', err);
        return null;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for client to update his message read ack
 *             
 * @param {String}          user, user uid
 * @param {String}          channelId, channel id
 */
exports.readAckAsync = function(user, channelId) {
    return Promise.props({
        ackResult: ChannelMemberDao.updateMsgAsync(user, channelId),
        isAuth: _ensureAuth(user, channelId)
    }).then(function(data) {
        return data.ackResult;
    }).catch(function(err) {
        SharedUtils.printError('msgService.js', 'readAckAsync', err);
        return null;
    });
};

/**
 * @Author: George_Chen
 * @Description: used to ensure the channel related request is authed
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 */
function _ensureAuth(member, channelId) {
    return ChannelStoreage.getAuthAsync(member, channelId)
        .then(function(isAuth) {
            if (!isAuth) {
                throw new Error('get auth fail');
            }
            return true;
        });
}
