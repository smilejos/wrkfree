'use strict';
var Redis = require('redis');
var Promise = require('bluebird');
var Configs = require('../configs');
var SharedUtils = require('../../sharedUtils/utils');
var GLOBAL_OnlineUserKey = 'SYSTEM:onlineusers';
var GLOBAL_SessionPrefix = 'sess:';

/**
 * Online user list is stored at global redis cache server
 */
var RedisClient = Redis.createClient(
    Configs.globalCacheEnv.port,
    Configs.globalCacheEnv.host,
    Configs.globalCacheEnv.options);

/**
 * Public API
 * @Author: George_Chen
 * @Description: check candidate user is online or not
 *
 * @param  {String}           candidate, candidate user id
 */
exports.isUserOnlineAsync = function(candidate) {
    return SharedUtils.argsCheckAsync(candidate, 'md5')
        .then(function(candidateUid) {
            return RedisClient.sismemberAsync(candidateUid, GLOBAL_OnlineUserKey);
        }).catch(function(err) {
            SharedUtils.printError('UserTemp', 'isUserOnlineAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: get session infomation which store at redis cache
 *
 * @param  {String}           webSid, user's web session id
 */
exports.getWebSessionAsync = function(webSid) {
    return SharedUtils.argsCheckAsync(webSid, 'string')
        .then(function(validSid) {
            return RedisClient.getAsync(GLOBAL_SessionPrefix + validSid);
        }).catch(function(err) {
            SharedUtils.printError('UserTemp', 'getWebSessionAsync', err);
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: set the user to online user list
 *
 * @param  {String}           uid, user's id
 */
exports.enterAsync = function(uid) {
    return SharedUtils.argsCheckAsync(uid, 'md5')
        .then(function(validUid) {
            return RedisClient.saddAsync(GLOBAL_OnlineUserKey, validUid);
        }).catch(function(err) {
            SharedUtils.printError('UserTemp', 'enterAsync', err);
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: remove the user from online user list
 *
 * @param  {String}           uid, user's id
 */
exports.leaveAsync = function(uid) {
    return SharedUtils.argsCheckAsync(uid, 'md5')
        .then(function(validUid) {
            return RedisClient.sremAsync(GLOBAL_OnlineUserKey, validUid);
        }).catch(function(err) {
            SharedUtils.printError('UserTemp', 'leaveAsync', err);
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to check user has socket binded or not
 *
 * @param  {String}           uid, user's id
 */
exports.isSocketExistAsync = function(uid) {
    return SharedUtils.argsCheckAsync(uid, 'md5')
        .then(function(validUid) {
            var userSocketKey = 'user:' + validUid + ':sockets';
            return RedisClient.existsAsync(userSocketKey);
        }).catch(function(err) {
            SharedUtils.printError('UserTemp', 'isSocketExistAsync', err);
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to bind another websocket
 *
 * @param  {String}           uid, user's id
 * @param  {String}           socketId, websocket id
 */
exports.bindSocketAsync = function(uid, socketId) {
    return Promise.join(
        SharedUtils.argsCheckAsync(uid, 'md5'),
        SharedUtils.argsCheckAsync(socketId, 'string'),
        function(validUid, validSocketId) {
            var userSocketKey = 'user:' + validUid + ':sockets';
            return RedisClient.saddAsync(userSocketKey, validUid);
        }).catch(function(err) {
            SharedUtils.printError('UserTemp', 'bindSocketAsync', err);
            return false;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to unbind another socket
 *
 * @param  {String}           uid, user's id
 * @param  {String}           socketId, websocket id
 */
exports.unbindSocketAsync = function(uid, socketId) {
    return Promise.join(
        SharedUtils.argsCheckAsync(uid, 'md5'),
        SharedUtils.argsCheckAsync(socketId, 'string'),
        function(validUid, validSocketId) {
            var userSocketKey = 'user:' + validUid + ':sockets';
            return RedisClient.sremAsync(userSocketKey, validUid);
        }).catch(function(err) {
            SharedUtils.printError('UserTemp', 'unbindSocketAsync', err);
            return false;
        });
};
