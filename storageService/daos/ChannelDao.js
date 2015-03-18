'use strict';
var Mongoose = require('mongoose');
var Promise = require('bluebird');
var DbUtil = require('../dbUtils');
var SharedUtils = require('../../sharedUtils/utils');
var Model = Mongoose.model('Channel');
var ObjectAssign = require('object-assign');

/************************************************
 *
 *           Public APIs
 *
 ************************************************/

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to create channel document
 *
 * @param {String}          channelId, channel id
 * @param {String}          channelName, full channel name
 * @param {String}          channelType, channel type
 */
exports.newChannelAsync = function(channelId, channelName, channelType) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(channelId, 'channelId'),
        name: SharedUtils.argsCheckAsync(channelName, 'channelName', channelType),
        type: channelType
    }).then(function(doc) {
        return new Model(doc);
    }).then(function(newChannel) {
        // make mongoose cache outdated
        Model.find()._touchCollectionCheck(true);
        return newChannel.saveAsync();
    }).then(function(result) {
        return DbUtil.checkDocumentSaveStatusAsync(result);
    }).catch(function(err) {
        SharedUtils.printError('ChannelDao', 'newChannelAsync', err);
        return null;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: used to check channel is exist or not
 *
 * @param {String}          channelId, channel id
 */
exports.isExistAsync = function(channelId) {
    return _isExist(channelId, {})
        .catch(function(err) {
            SharedUtils.printError('ChannelDao', 'isExistAsync', err);
            throw err;
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
    return _isExist(channelId, {
        isAnonymousLogin: true
    }).catch(function(err) {
        SharedUtils.printError('ChannelDao', 'isAnonymousLoginAsync', err);
        throw err;
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
    return SharedUtils.argsCheckAsync(password, 'string')
        .then(function(validPassword) {
            return _isExist(channelId, {
                anonymousPassword: validPassword
            });
        }).catch(function(err) {
            SharedUtils.printError('ChannelDao', 'anonymousLoginAsync', err);
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to find specific channel's document
 *
 * @param {String}          channelId, channel id
 */
exports.findByChanelAsync = function(channelId) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(channelId, 'channelId')
    }).then(function(condition) {
        return _find(true, condition);
    }).catch(function(err) {
        SharedUtils.printError('ChannelDao', 'findByChanelAsync', err);
        return null;
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
        if (!SharedUtils.isChannelId(channelId)) {
            throw new Error('channel id is invalid');
        }
        return channelId;
    }).then(function(channels) {
        var condition = {
            channelId: {
                $in: channels
            }
        };
        return _find(false, condition);
    }).catch(function(err) {
        SharedUtils.printError('ChannelDao', 'findByChanelsAsync', err);
        return [];
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to search channels that matched partial channel name
 *
 * @param {String}          name, partial channel name
 */
exports.searchByNameAsync = function(name) {
    return SharedUtils.argsCheckAsync(name, 'alphabet')
        .then(function(validName) {
            var condition = {
                name: new RegExp('#' + validName + '.*', 'i'),
                type: 'public'
            };
            return _find(false, condition);
        }).catch(function(err) {
            SharedUtils.printError('ChannelDao', 'searchByNameAsync', err);
            return [];
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to delete channel document
 *
 * @param {String}          channelId, channel id
 */
exports.delChannelAsync = function(channelId) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(channelId, 'channelId'),
        type: 'public'
    }).then(function(condition) {
        // make mongoose cache outdated
        Model.find()._touchCollectionCheck(true);
        return Model.removeAsync(condition);
    }).then(function(result) {
        return DbUtil.checkDocumentRemoveStatusAsync(result);
    }).catch(function(err) {
        SharedUtils.printError('ChannelDao', 'delChannelAsync', err);
        return null;
    });
};

/************************************************
 *
 *           internal functions
 *
 ************************************************/

/**
 * @Author: George_Chen
 * @Description: an low-level implementation of exist operation
 *
 * @param {String}          channelId, channel id
 * @param {String}          extraFields, extra searching fields
 */
function _isExist(channelId, extraFields) {
    return Promise.props({
        channelId: SharedUtils.argsCheckAsync(channelId, 'channelId')
    }).then(function(condition) {
        var queryCondition = ObjectAssign(condition, extraFields);
        return Model.countAsync(queryCondition);
    }).then(function(count) {
        return DbUtil.checkDocumentExistStatusAsync(count);
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
    var fields = (selectFields ? selectFields : DbUtil.selectOriginDoc());
    return (isFindOne ? Model.findOne(condition, fields) : Model.find(condition, fields))
        .lean()
        .execAsync();
}
