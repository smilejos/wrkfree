'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');
var StorageManager = require('../../../storageService/storageManager');
var UserStorage = StorageManager.getService('User');

/**
 * Public API
 * @Author: George_Chen
 * @Description: handle the request of getting user info
 *
 * @param {Object}          socket, the client socket instance
 * @param {Array/String}    data.users, array of uids or single uid
 */
exports.getInfoAsync = function(socket, data) {
    var uid = socket.getAuthToken();
    return Promise.try(function() {
        if (SharedUtils.isMd5Hex(data.users)) {
            return UserStorage.getUserAsync(data.users);
        }
        var list = SharedUtils.fastArrayMap(data.users, function(user) {
            if (SharedUtils.isMd5Hex(user)) {
                return user;
            }
            throw new Error('data.users params error');
        });
        return UserStorage.getUserAsync(list, uid);
    }).then(function(result) {
        if (!result || result.length === 0) {
            throw new Error('user not exist');
        }
        return result;
    }).catch(function(err) {
        SharedUtils.printError('userHandler.js', 'getInfoAsync', err);
        throw new Error('get user info fail');
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: handle the request of searching users
 *
 * @param {Object}          socket, the client socket instance
 * @param {String}          data.searchStr, the string used to search users
 */
exports.searchAsync = function(socket, data) {
    return SharedUtils.argsCheckAsync(data.searchStr, 'alphabet')
        .then(function(validString) {
            return UserStorage.findUsersAsync(validString);
        }).catch(function(err) {
            SharedUtils.printError('userHandler.js', 'searchAsync', err);
            throw new Error('search user fail');
        });
};
