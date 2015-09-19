'use strict';
var Mongoose = require('mongoose');
var Promise = require('bluebird');
var DbUtil = require('../dbUtils');
var SharedUtils = require('../../sharedUtils/utils');
var Model = Mongoose.model('Notification');

/************************************************
 *
 *           Public APIs
 *
 ************************************************/

/**
 * Public API
 * @Author: George_Chen
 * @Description: to create a channel type notification
 *
 * @param {String}          sender, the uid of req uesr
 * @param {String}          target, the uid of target user
 * @param {String}          content, notification content message
 * @param {String}          channelId, the channel id
 */
exports.createByChannelAsync = function(sender, target, content, channelId) {
    return Promise.props({
        _id: Mongoose.Types.ObjectId().toString(),
        sender: SharedUtils.argsCheckAsync(sender, 'md5'),
        target: SharedUtils.argsCheckAsync(target, 'md5'),
        content: SharedUtils.argsCheckAsync(content, 'string'),
        type: 'channel',
        extraInfo: SharedUtils.argsCheckAsync(channelId, 'md5')
    }).then(function(doc) {
        return new Model(doc);
    }).then(function(notification) {
        // make mongoose cache outdated
        Model.find()._touchCollectionCheck(true);
        return notification.saveAsync();
    }).then(function(result) {
        return DbUtil.checkDocumentSaveStatusAsync(result);
    }).then(function(doc) {
        return DbUtil.transformToNewIdAsync(doc, 'noticeId');
    }).catch(function(err) {
        SharedUtils.printError('NotificationDao', 'createAsync', err);
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: find all notifications based on target user id
 *
 * @param {String}          targetUser, the uid of target user
 */
exports.findByTargetAsync = function(target) {
    return Promise.props({
        target: SharedUtils.argsCheckAsync(target, 'md5')
    }).then(function(condition) {
        var fields = {
            __v: DbUtil.select(false)
        };
        var sortOrder = DbUtil.getSort('updatedTime', 'descending');
        return Model.find(condition).sort(sortOrder).select(fields).lean().execAsync();
    }).map(function(doc) {
        return DbUtil.transformToNewIdAsync(doc, 'noticeId');
    }).map(function(doc) {
        return DbUtil.transformTimeAsync(doc, 'updatedTime');
    }).catch(function(err) {
        SharedUtils.printError('NotificationDao', 'findByTargetAsync', err);
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to delete target notification
 *
 * @param {String}          noticeId, the _id of target notification
 * @param {String}          receiver, the uid of receiver
 */
exports.deleteAsync = function(noticeId, receiver) {
    return Promise.props({
        _id: SharedUtils.argsCheckAsync(noticeId, '_id'),
        target: SharedUtils.argsCheckAsync(receiver, 'md5')
    }).then(function(condition) {
        // make mongoose cache outdated
        Model.find()._touchCollectionCheck(true);
        return Model.removeAsync(condition);
    }).then(function(result) {
        return DbUtil.checkDocumentRemoveStatusAsync(result);
    }).catch(function(err) {
        SharedUtils.printError('NotificationDao', 'deleteAsync', err);
        throw err;
    });
};
