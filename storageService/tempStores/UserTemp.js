'use strict';
var Redis = require('redis');
var Promise = require('bluebird');
var SharedUtils = require('../../sharedUtils/utils');
var Configs = require('../../configs/config');

var ONLINE_USERS_KEY_PREFIX = 'SYSTEM:onlineusers';
var USER_SESSION_PREFIX = 'sess:';
var ONLINE_USERS_KEY_TTL_IN_SECOND = Configs.get().params.system.onlineUserKeyTimeoutInSecond;
if (!SharedUtils.isNumber(ONLINE_USERS_KEY_TTL_IN_SECOND)) {
    throw new Error('system params error');
}

var DbConfigs = Configs.get().db;
if (!DbConfigs) {
    throw new Error('DB configurations broken');
}

/**
 * Online user list is stored at global redis cache server
 */
var RedisClient = Redis.createClient(
    DbConfigs.cacheEnv.global.port,
    DbConfigs.cacheEnv.global.host,
    DbConfigs.cacheEnv.global.options);

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
            return Promise.join(
                RedisClient.sismemberAsync(_getUserKey(), candidateUid),
                RedisClient.sismemberAsync(_getUserKey(true), candidateUid),
                function(isActived, isIdled) {
                    return (isActived + isIdled > 0);
                });
        }).catch(function(err) {
            SharedUtils.printError('UserTemp', 'isUserOnlineAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: used to check which uids on users are online
 *         NOTE: will reutnr an array including current online uids
 *
 * @param  {Array}           users, an array of uids
 */
exports.getOnlineUsersAsync = function(users) {
    return Promise.map(users, function(uid) {
        return SharedUtils.argsCheckAsync(uid, 'md5');
    }).then(function(uids) {
        var tempKey = Date.now().toString(); // use timestamp as an unique tempKey
        var sunionKey = Date.now().toString();
        return RedisClient.multi()
            .sadd(tempKey, uids)
            .sunionstore(sunionKey, _getUserKey(), _getUserKey(true))
            .sinter(tempKey, sunionKey)
            .del(tempKey, sunionKey)
            .execAsync();
    }).then(function(multiResult) {
        return multiResult[2]; // the exec Result of sinter()
    }).catch(function(err) {
        SharedUtils.printError('UserTemp', 'getOnlineUsersAsync', err);
        throw err;
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
            return RedisClient.getAsync(USER_SESSION_PREFIX + validSid);
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
    var key = _getUserKey();
    return SharedUtils.argsCheckAsync(uid, 'md5')
        .then(function(validUid) {
            return RedisClient.saddAsync(key, validUid);
        }).then(function() {
            return RedisClient.ttlAsync(key).then(function(ttl) {
                return (ttl === -1 ? RedisClient.expireAsync(key, ONLINE_USERS_KEY_TTL_IN_SECOND) : true);
            });
        }).catch(function(err) {
            SharedUtils.printError('UserTemp', 'enterAsync', err);
            throw err;
        });
};

/**
 * @Author: George_Chen
 * @Description: used to cacluate the redis key to store online users
 *         NOTE: for getting online users, we find users stored on redis based on 
 *               the key "current minute" and "last minute"
 *
 * @param  {Boolean}           isIdled, to get idled user key or not
 */
function _getUserKey(isIdled) {
    // to ensure only positive number will be getten
    var min = ~~(Date.now() / 60000);
    if (isIdled) {
        --min;
    }
    return ONLINE_USERS_KEY_PREFIX + ':' + min.toString();
}
