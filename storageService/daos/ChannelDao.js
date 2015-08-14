'use strict';
var Mongoose = require('mongoose');
var Promise = require('bluebird');
var DbUtil = require('../dbUtils');
var SharedUtils = require('../../sharedUtils/utils');
var CryptoUtils = require('../../sharedUtils/cryptoUtils');
var Model = Mongoose.model('Channel');

/************************************************
 *
 *           Public APIs
 *
 ************************************************/

/**
 * Public API
 * @Author: George_Chen
 * @Description: create normal channel document
 *
 * @param {String}          channelId, channel id
 * @param {String}          creator, the creator uid
 * @param {String}          name, the channel name
 * @param {Boolean}         isPublic, is channel public
 * @param {String}          org, organization name
 */
exports.createAsync = function(channelId, creator, name, isPublic, org) {
    return Promise.props({
        _id: SharedUtils.argsCheckAsync(channelId, 'md5'),
        host: SharedUtils.argsCheckAsync(creator, 'md5'),
        name: SharedUtils.argsCheckAsync(name, 'channelName'),
        isPublic: SharedUtils.argsCheckAsync(isPublic, 'boolean'),
        is1on1: false
    }).then(function(doc) {
        if (SharedUtils.isString(org)) {
            doc.organization = org;
        }
        return _save(doc, 'createAsync');
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: create 1on1 channel document
 *
 * @param {String}          channelId, channel id
 * @param {String}          user1, the user1's uid
 * @param {String}          user2, the user2's uid
 */
exports.create1on1Async = function(user1, user2) {
    return Promise.props({
        uid1: SharedUtils.argsCheckAsync(user1, 'md5'),
        uid2: SharedUtils.argsCheckAsync(user2, 'md5'),
        isPublic: false,
        is1on1: true
    }).then(function(doc) {
        doc.host = SharedUtils.get1on1ChannelHost(doc.uid1, doc.uid2);
        doc._id = CryptoUtils.getMd5Hex(doc.host);
        return _save(doc, 'create1on1Async');
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: used to check channel is created or not
 *
 * @param {String}          hostUid, host's uid
 * @param {String}          channelName, channel's name
 */
exports.isCreatedAsync = function(hostUid, channelName) {
    return Promise.props({
        host: SharedUtils.argsCheckAsync(hostUid, 'md5'),
        name: SharedUtils.argsCheckAsync(channelName, 'string')
    }).then(function(condition) {
        return _isExist(condition, 'isCreatedAsync');
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: check channel has turned on the anonymousLogin or not
 *
 * @param {String}          channelId, channel id
 */
exports.isAnonymousLoginAsync = function(channelId) {
    return Promise.props({
        _id: SharedUtils.argsCheckAsync(channelId, 'md5'),
        isAnonymousLogin: true
    }).then(function(condition) {
        return _isExist(condition, 'isAnonymousLoginAsync');
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for anonymous user to login channel
 *
 * @param {String}          channelId, channel id
 * @param {String}          password, the login password
 */
exports.anonymousLoginAsync = function(channelId, password) {
    return Promise.props({
        _id: SharedUtils.argsCheckAsync(channelId, 'md5'),
        anonymousPassword: SharedUtils.argsCheckAsync(password, 'string')
    }).then(function(condition) {
        return _isExist(condition, 'anonymousLoginAsync');
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to find specific channel's document
 *
 * @param {String}          channelId, channel id
 */
exports.findByChannelAsync = function(channelId, is1on1) {
    return Promise.props({
        _id: SharedUtils.argsCheckAsync(channelId, 'md5')
    }).then(function(condition) {
        if (SharedUtils.isBoolean(is1on1)) {
            condition.is1on1 = is1on1;
        }
        return _find(true, condition);
    }).then(function(doc) {
        return DbUtil.transformToNewIdAsync(doc, 'channelId');
    }).catch(function(err) {
        SharedUtils.printError('ChannelDao.js', 'findByChannelAsync', err);
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to find channels based on give channelIds
 *
 * @param {String}          channelIds, an array of channelids
 */
exports.findByChanelsAsync = function(channelIds) {
    return Promise.map(channelIds, function(channelId) {
        if (!SharedUtils.isMd5Hex(channelId)) {
            throw new Error('channel id is invalid');
        }
        return channelId;
    }).then(function(channels) {
        var condition = {
            _id: {
                $in: channels
            }
        };
        return _find(false, condition);
    }).map(function(doc) {
        return DbUtil.transformToNewIdAsync(doc, 'channelId');
    }).catch(function(err) {
        SharedUtils.printError('ChannelDao.js', 'findByChanelsAsync', err);
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to delete normal channel document
 *
 * @param {String}          channelId, channel id
 * @param {String}          hostUid, the host uid
 */
exports.deleteAsync = function(channelId, hostUid) {
    return Promise.props({
        _id: SharedUtils.argsCheckAsync(channelId, 'md5'),
        host: SharedUtils.argsCheckAsync(hostUid, 'md5'),
        is1on1: false
    }).then(function(condition) {
        return _delete(condition, 'deleteAsync');
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to delete 1on1 channel document
 *
 * @param {String}          channelId, channel id
 * @param {String}          user1, the user1's uid
 * @param {String}          user2, the user2's uid
 */
exports.delete1on1Async = function(channelId, user1, user2) {
    return Promise.join(
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        SharedUtils.argsCheckAsync(user1, 'md5'),
        SharedUtils.argsCheckAsync(user2, 'md5'),
        function(cid, uid1, uid2) {
            var condition = {
                _id: cid,
                host: SharedUtils.get1on1ChannelHost(uid1, uid2),
                isPublic: false,
                is1on1: true
            };
            return _delete(condition, 'delete1on1Async');
        });
};

/************************************************
 *
 *           internal functions
 *
 ************************************************/

/**
 * @Author: George_Chen
 * @Description: an low-level implementation of save operation
 *
 * @param {Object}          channelDoc, new channel document
 * @param {String}          caller, caller of this API
 */
function _save(channelDoc, caller) {
    // make mongoose cache outdated
    Model.find()._touchCollectionCheck(true);
    var newChannel = new Model(channelDoc);
    return newChannel.saveAsync()
        .then(function(result) {
            return DbUtil.checkDocumentSaveStatusAsync(result);
        }).then(function(channelDoc) {
            return DbUtil.transformToNewIdAsync(channelDoc, 'channelId');
        }).catch(function(err) {
            SharedUtils.printError('ChannelDao.js', caller, err);
            throw err;
        });
}

/**
 * @Author: George_Chen
 * @Description: an low-level implementation of delete operation
 *
 * @param {Object}          condition, the query condition
 * @param {String}          caller, caller of this API
 */
function _delete(condition, caller) {
    // make mongoose cache outdated
    Model.find()._touchCollectionCheck(true);
    return Model.removeAsync(condition)
        .then(function(result) {
            return DbUtil.checkDocumentRemoveStatusAsync(result);
        }).catch(function(err) {
            SharedUtils.printError('ChannelDao.js', caller, err);
            throw err;
        });
}

/**
 * @Author: George_Chen
 * @Description: an low-level implementation of exist operation
 *
 * @param {String}          channelId, channel id
 * @param {String}          extraFields, extra searching fields
 */
function _isExist(condition, caller) {
    return Model.countAsync(condition)
        .then(function(count) {
            return DbUtil.checkDocumentExistStatusAsync(count);
        }).catch(function(err) {
            SharedUtils.printError('ChannelDao.js', caller, err);
            throw err;
        });
}

/**
 * @Author: George_Chen
 * @Description: an low-level implementation of find operation
 *
 * @param {Boolean}         isFindOne, use "findOne" or "find" based on this flag
 * @param {String}          condition, the mongoose query condition
 * @param {String}          selectFields, used to inform mongoose which fields should be taken
 */
function _find(isFindOne, condition, selectFields) {
    var fields = {
        __v: DbUtil.select(false)
    };
    if (selectFields) {
        fields = selectFields;
    }
    return (isFindOne ? Model.findOne(condition, fields) : Model.find(condition, fields))
        .lean()
        .execAsync();
}
