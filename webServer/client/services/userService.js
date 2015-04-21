'use strict';
var SocketManager = require('./socketManager');
var SharedUtils = require('../../../sharedUtils/utils');
var Promise = require('bluebird');

/**
 * the Users info cache on browser
 */
var Users = {};

/**
 * Public API
 * @Author: George_Chen
 * @Description: get user info by the uid
 *
 * @param {String}          uid, user's id
 */
exports.getInfoAsync = function(uid) {
    return SharedUtils.argsCheckAsync(uid, 'md5')
        .then(function(validUid) {
            var info = Users[validUid];
            return (!!info ? info : _getInfoRemote(validUid));
        }).catch(function(err) {
            SharedUtils.printError('userService.js', 'getUserAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: get the userInfo of group of users
 *
 * @param {Array}          users, group of user ids
 */
exports.getGroupInfoAsync = function(users) {
    var results = [];
    return Promise.filter(users, function(uid) {
        if (!SharedUtils.isMd5Hex(uid)) {
            throw new Error('invalid uid');
        }
        var info = Users[uid];
        if (info) {
            results.push(info);
        }
        return !info;
    }).then(function(remoteQueries) {
        return (remoteQueries.length === 0 ? [] : _getInfoRemote(remoteQueries));
    }).then(function(remoteResults) {
        return results.concat(remoteResults);
    }).catch(function(err) {
        SharedUtils.printError('userService.js', 'getUserAsync', err);
        return null;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: polyfill the user info to local cache
 *
 * @param {Array/Object}          userInfos, can be a user info json or group of userInfos
 */
exports.polyfillAsync = function(userInfos) {
    var isUsers = SharedUtils.isArray(userInfos);
    return (isUsers ? Promise.map(userInfos, _cacheInfo) : _cacheInfo(userInfos))
        .catch(function(err) {
            SharedUtils.printError('userService.js', 'polyfillAsync', err);
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
 * @Description: get the target user(users) info from server
 *
 * @param {Array/String}          user, can be a uid or group of uids
 */
function _getInfoRemote(user) {
    var packet = {
        service: 'User',
        api: 'getInfoAsync',
        params: {
            users: user
        }
    };
    var isUsers = SharedUtils.isArray(user);
    var request = SocketManager.requestAsync(packet);
    return (isUsers ? request.map(_cacheInfo) : request.then(_cacheInfo));
}

/**
 * @Author: George_Chen
 * @Description: cache the user info json to the local user cache
 *
 * @param {Object}          info, the user info json object
 */
function _cacheInfo(info) {
    return Promise.props({
        uid: SharedUtils.argsCheckAsync(info.uid, 'md5'),
        nickName: SharedUtils.argsCheckAsync(info.nickName, 'nickName'),
        avatar: SharedUtils.argsCheckAsync(info.avatar, 'avatar')
    }).then(function(validInfo) {
        Users[validInfo.uid] = validInfo;
        return validInfo;
    });
}
