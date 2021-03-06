'use strict';
var Promise = require('bluebird');
var Redis = require('redis');
var SharedUtils = require('../../sharedUtils/utils');
var GLOBAL_OnlineUserKey = 'SYSTEM:onlineusers';
var Configs = require('../../configs/config');
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

/************************************************
 *
 *           Public APIs
 *
 ************************************************/

/**
 * Public API
 * @Author: George_Chen
 * @Description: get the online friend uids based on all friendlist
 * 
 * @param {Array}       friends, an array friend documents store in mongodb
 */
exports.getOnlineFriendsAsync = function(friends) {
    return Promise.map(friends, function(doc) {
        return (SharedUtils.isMd5Hex(doc.uid) ? doc.uid : '');
    }).then(function(friendUids) {
        var tempKey = Date.now().toString(); // use timestamp as an unique tempKey
        return RedisClient
            .multi()
            .sadd(tempKey, friendUids)
            .sinter(tempKey, GLOBAL_OnlineUserKey)
            .del(tempKey)
            .execAsync();
    }).then(function(multiResult) {
        return multiResult[1]; // the exec Result of sinter()
    }).catch(function(err) {
        SharedUtils.printError('FriendTemp', 'getOnlineFriendsAsync', err);
        throw err;
    });
};
