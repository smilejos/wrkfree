'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');
var StorageManager = require('../../../storageService/storageManager');
var FriendStorage = StorageManager.getService('Friend');

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to delete friendship between he and target user
 *
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.candidate, target candidate user
 */
exports.delFriendshipAsync = function(socket, data) {
    var uid = socket.getAuthToken();
    return Promise.props({
        asker: SharedUtils.argsCheckAsync(uid, 'md5'),
        target: SharedUtils.argsCheckAsync(data.candidate, 'md5')
    }).then(function(params) {
        return FriendStorage.delFriendshipAsync(params.target, params.asker);
    }).then(function(delResult) {
        if (!delResult || delResult.length === 0) {
            throw new Error('friendship not exist or storage internal error');
        }
        return true;
    }).catch(function(err) {
        SharedUtils.printError('friendHandler.js', 'delFriendshipAsync', err);
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to get friendlist of target candidate
 *
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.candidate, target candidate user
 */
exports.getFriendsAsync = function(socket, data) {
    var uid = socket.getAuthToken();
    return Promise.props({
        asker: SharedUtils.argsCheckAsync(uid, 'md5'),
        target: SharedUtils.argsCheckAsync(data.candidate, 'md5')
    }).then(function(params) {
        return FriendStorage.getFriendListAsync(params.target, params.asker);
    }).then(function(friends) {
        var errMsg = 'fail to get friends information on storage service';
        return SharedUtils.checkExecuteResult(friends, errMsg);
    }).catch(function(err) {
        SharedUtils.printError('friendHandler.js', 'getFriendListAsync', err);
        throw new Error('get friend list fail');
    });
};
