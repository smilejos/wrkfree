'use strict';
var Promise = require('bluebird');
var Redis = require('redis');
var SharedUtils = require('../../sharedUtils/utils');
var Configs = require('../../configs/config');

/**
 * setup rtc params
 */
var SESSION_TIMEOUT_IN_SECOND = Configs.get().params.rtc.sessionTimeoutInSecond;
if (!SharedUtils.isNumber(SESSION_TIMEOUT_IN_SECOND)) {
    throw new Error('not correct rtc parameters');
}

/**
 * setup redis client
 */
var DbConfigs = Configs.get().db;
if (!DbConfigs) {
    throw new Error('DB configurations broken');
}

var RedisClient = Redis.createClient(
    DbConfigs.cacheEnv.global.port,
    DbConfigs.cacheEnv.global.host,
    DbConfigs.cacheEnv.global.options);

/************************************************
 *
 *          Public APIs
 *
 ************************************************/

/**
 * Public API
 * @Author: George_Chen
 * @Description: add rtc client on current rtc session
 *
 * @param {String}      channelId, channel id
 * @param {String}      clientId, the client socket id
 */
exports.joinAsync = function(channelId, clientId) {
    return Promise.join(
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        SharedUtils.argsCheckAsync(clientId, 'string'),
        function(cid, client) {
            var redisKey = _getSessionKey(cid);
            return RedisClient
                .multi()
                .sadd(redisKey, client)
                .expire(redisKey, SESSION_TIMEOUT_IN_SECOND)
                .execAsync();
        }).catch(function(err) {
            SharedUtils.printError('RtcSessionTemp.js', 'joinAsync', err);
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: remove rtc client from current rtc session
 *
 * @param {String}      channelId, channel id
 * @param {String}      clientId, the client socket id
 */
exports.leaveAsync = function(channelId, clientId) {
    return Promise.join(
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        SharedUtils.argsCheckAsync(clientId, 'string'),
        function(cid, client) {
            var redisKey = _getSessionKey(cid);
            return RedisClient.sremAsync(redisKey, client);
        }).catch(function(err) {
            SharedUtils.printError('RtcSessionTemp.js', 'leaveAsync', err);
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to get the infotmation(members) in current rtc session
 *
 * @param {String}      channelId, channel id
 */
exports.getAsync = function(channelId) {
    return SharedUtils.argsCheckAsync(channelId, 'md5')
        .then(function(cid) {
            var redisKey = _getSessionKey(cid);
            return RedisClient.smembersAsync(redisKey);
        }).catch(function(err) {
            SharedUtils.printError('rtcSessionTemp.js', 'getAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to check current rtc session is exist or not
 *
 * @param {String}      channelId, channel id
 */
exports.isExistAsync = function(channelId) {
    return SharedUtils.argsCheckAsync(channelId, 'md5')
        .then(function(cid) {
            var redisKey = _getSessionKey(cid);
            return RedisClient.existsAsync(redisKey);
        }).catch(function(err) {
            SharedUtils.printError('rtcSessionTemp.js', 'isExistAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to release current rtc session
 *
 * @param {String}      channelId, channel id
 */
exports.deleteAsync = function(channelId) {
    console.log('[DEBUG] =======delete rtc session=========> ', channelId);
    return SharedUtils.argsCheckAsync(channelId, 'md5')
        .then(function(cid) {
            var redisKey = _getSessionKey(cid);
            return RedisClient.delAsync(redisKey);
        }).catch(function(err) {
            SharedUtils.printError('rtcSessionTemp.js', 'deleteAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to keep cuurent rtc session alive
 *
 * @param {String}      channelId, channel id
 */
exports.keepAliveAsync = function(channelId) {
    return SharedUtils.argsCheckAsync(channelId, 'md5')
        .then(function(cid) {
            var redisKey = _getSessionKey(cid);
            return RedisClient.multi()
                .expire(redisKey, SESSION_TIMEOUT_IN_SECOND)
                .ttl(redisKey)
                .execAsync().then(function(multiResult){
                    console.log('[DEBUG] ================set result: %s, time to live: %s', multiResult[0], multiResult[1]);
                    return multiResult[0];
                });
        }).catch(function(err) {
            SharedUtils.printError('RtcSessionTemp.js', 'keepAliveAsync', err);
            throw err;
        });
};

/************************************************
 *
 *          internal functions
 *
 ************************************************/

/**
 * @Author: George_Chen
 * @Description: to get the redis key for rtc session
 *
 * @param {String}   cid, channel id
 */
function _getSessionKey(cid) {
    return 'channel:' + cid + ':rtc:session';
}
