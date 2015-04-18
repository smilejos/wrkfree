'use strict';
var SharedUtils = require('../../sharedUtils/utils');
var Promise = require('bluebird');
var MsgDao = require('../daos/MsgDao');
var ChannelMemberDao = require('../daos/ChannelMemberDao');

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
    return MsgDao.saveMsgAsync(sender, channelId, msg)
        .then(function(result) {
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
    return Promise.all([
        MsgDao.findByChannelAsync(channelId, timePeriod),
        ChannelMemberDao.updateMsgAsync(user, channelId)
    ]).catch(function(err) {
        SharedUtils.printError('msgService.js', 'pullAsync', err);
        return null;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to find the latest message on a group of channels
 *
 * @param {Array}          channels, an array of channelIds
 */
exports.getLatestAsync = function(channels) {
    return MsgDao.findChannelsLatestAsync(channels)
        .catch(function(err) {
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
    return ChannelMemberDao.updateMsgAsync(user, channelId)
        .catch(function(err) {
            SharedUtils.printError('msgService.js', 'readAckAsync', err);
            return null;
        });
};
