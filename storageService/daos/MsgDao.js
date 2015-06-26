'use strict';
var Mongoose = require('mongoose');
var Promise = require('bluebird');
var DbUtil = require('../dbUtils');
var SharedUtils = require('../../sharedUtils/utils');
var Model = Mongoose.model('Msg');

var MSG_QUERY_NUMBER = 20;

/**
 * Public API
 * @Author: George_Chen
 * @Description: save new chat message to db
 *
 * @param {String}          sender, sender uid
 * @param {String}          channelId, channel id
 * @param {String}          msg, message content
 */
exports.saveMsgAsync = function(sender, channelId, msg) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(channelId, 'md5'),
        message: SharedUtils.argsCheckAsync(msg, 'string'),
        from: SharedUtils.argsCheckAsync(sender, 'md5'),
    }).then(function(doc) {
        var newMsg = new Model(doc);
        // make mongoose cache outdated
        Model.find()._touchCollectionCheck(true);
        return newMsg.saveAsync();
    }).then(function(result) {
        return DbUtil.checkDocumentSaveStatusAsync(result);
    }).catch(function(err) {
        SharedUtils.printError('MsgDao.js', 'saveMsgAsync', err);
        return null;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: find specific user's messages
 *         NOTE: period is optional argument controls the query restriction
 *
 * @param {String}          uid, user's uid
 * @param {Object}          period, the query time period
 *                          period.start, the start time of this period
 *                          period.end, the end time of this period
 */
exports.findByUidAsync = function(uid, period) {
    return Promise.props({
        from: SharedUtils.argsCheckAsync(uid, 'md5')
    }).then(function(condition) {
        return DbUtil.getTimeCondAsync(condition, 'sentTime', period);
    }).then(function(queryCondition) {
        return _findMsg(queryCondition);
    }).catch(function(err) {
        SharedUtils.printError('MsgDao.js', 'findByUidAsync', err);
        return null;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to find specific channel's messages
 *         NOTE: period is optional argument controls the query restriction
 *
 * @param {String}          channelId, channel id
 * @param {Object}          period, the query time period
 *                          period.start, the start time of this period
 *                          period.end, the end time of this period
 */
exports.findByChannelAsync = function(channelId, period) {
    var timePeriod = period || {};
    var queryNums = (!!timePeriod.start ? 0 : MSG_QUERY_NUMBER);
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(channelId, 'md5')
    }).then(function(condition) {
        return DbUtil.getTimeCondAsync(condition, 'sentTime', period);
    }).then(function(queryCondition) {
        return _findMsg(queryCondition, queryNums);
    }).map(function(doc) {
        return DbUtil.transformTimeAsync(doc, 'sentTime');
    }).catch(function(err) {
        SharedUtils.printError('MsgDao.js', 'findByChannelAsync', err);
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
exports.findChannelsLatestAsync = function(channels) {
    return Promise.map(channels, function(channelId) {
        return SharedUtils.argsCheckAsync(channelId, 'md5');
    }).then(function(validChannels) {
        var query = {
            $match: {
                channelId: {
                    $in: validChannels
                }
            }
        };
        var group = {
            $group: {
                _id: '$channelId',
                message: {$last: '$message'},
                sentTime: {$last: '$sentTime'},
                from: {$last: '$from'},
                channelId: {$last: '$channelId'}
            }
        };
        return Model.aggregateAsync(query, group);
    }).map(function(doc){
        return DbUtil.transformTimeAsync(doc, 'sentTime');
    }).catch(function(err) {
        SharedUtils.printError('MsgDao.js', 'findChannelsLatestAsync', err);
        return null;
    });
};

/**
 * @Author: George_Chen
 * @Description: an basic mongoose find operation
 *
 * @param {Object}      condition, mongoose query condition
 * @param {Number}      limitNum, the number of msgs will be query
 * @param {Object}      selectField, the field of msg doc will be queried
 */
function _findMsg(condition, limitNum, selectField) {
    var fields = (selectField ? selectField : DbUtil.selectOriginDoc());
    var sortOrder = DbUtil.getSort('sentTime', 'descending');
    var isFindOne = (limitNum === 1);
    return (isFindOne ? Model.findOne(condition, fields) : Model.find(condition, fields))
        .sort(sortOrder)
        .limit(limitNum)
        .lean()
        .execAsync();
}
