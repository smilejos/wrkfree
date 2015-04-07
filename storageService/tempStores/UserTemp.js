'use strict';
var Promise = require('bluebird');
var Redis = require('redis');
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
 * @param  {String}           uid, user's id
 * @param  {String}           webSid, user's web session id
 */
exports.getWebSessionAsync = function(user, webSid) {
    return Promise.join(
        SharedUtils.argsCheckAsync(user, 'md5'),
        SharedUtils.argsCheckAsync(webSid, 'string'),
        function(userUid, validSession) {
            return RedisClient.getAsync(GLOBAL_SessionPrefix + validSession);
        }).catch(function(err) {
            SharedUtils.printError('UserTemp', 'getWebSessionAsync', err);
            throw err;
        });
};
