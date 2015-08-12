'use strict';
var Promise = require('bluebird');
var Redis = require('redis');
var SharedUtils = require('../../sharedUtils/utils');
var GLOBAL_KEY_EXPIRE_TIME_IN_SECONDS = 100;

var Configs = require('../../configs/config');
var DbConfigs = Configs.get().db;
if (!DbConfigs) {
    throw new Error('DB configurations broken');
}

/**
 * Channel temp is currently kept at global cache
 * TODO: should we kept member list at local cache ?
 */
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
 * @Description: get the memberlist from channel temp storage
 *
 * @param {String}      channelId, channel's id
 */
exports.getMemberListAsync = function(channelId) {
    return SharedUtils.argsCheckAsync(channelId, 'md5')
        .then(function(validChannelId) {
            var redisKey = _getMemberKey(validChannelId);
            return RedisClient.smembersAsync(redisKey);
        }).catch(function(err) {
            SharedUtils.printError('ChannelTemp', 'getMemberListAsync', err);
            return [];
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: import member list to channel temp storage
 *
 * @param {String}      members, an array of member uids
 * @param {String}      channelId, channel's id
 */
exports.importMemberListAsync = function(members, channelId) {
    return Promise.join(
        Promise.map(members, function(memberUid) {
            return SharedUtils.argsCheckAsync(memberUid, 'md5');
        }),
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        function(membersUid, validChannelId) {
            var redisKey = _getMemberKey(validChannelId);
            return RedisClient.existsAsync(redisKey)
                .then(function(exist) {
                    return (exist ? _ttlMemberList(redisKey) : _importMembers(membersUid, redisKey));
                });
        }).catch(function(err) {
            SharedUtils.printError('ChannelTemp', 'importMemberListAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: check candidate is channel member or not by current channel temp storeage
 *
 * @param {String}      member, the member's uid
 * @param {String}      channelId, channel's id
 */
exports.isMemberAsync = function(member, channelId) {
    return Promise.join(
        SharedUtils.argsCheckAsync(member, 'md5'),
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        function(memberUid, validChannelId) {
            var redisKey = _getMemberKey(validChannelId);
            return Promise.props({
                listExist: _ttlMemberList(redisKey),
                memberExist: RedisClient.sismemberAsync(redisKey, memberUid)
            });
        }).catch(function(err) {
            SharedUtils.printError('ChannelTemp', 'isMemberAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: delete the cache of member list
 *
 * @param {String}      channelId, channel's id
 */
exports.deleteListAsync = function(channelId) {
    return SharedUtils.argsCheckAsync(channelId, 'md5')
        .then(function(validChannelId) {
            var redisKey = _getMemberKey(validChannelId);
            return RedisClient.delAsync(redisKey);
        }).catch(function(err) {
            SharedUtils.printError('ChannelTemp', 'deleteListAsync', err);
            return null;
        });
};

/************************************************
 *
 *          internal functions
 *
 ************************************************/

/**
 * @Author: George_Chen
 * @Description: get the temp storeage key for specific channel
 *
 * @param {String}      channelId, channel's id
 */
function _getMemberKey(channelId) {
    return 'channel:' + channelId + ':members';
}

/**
 * @Author: George_Chen
 * @Description: import member list to channel temp storage
 *
 * @param {String}      members, an array of member uids
 * @param {String}      redisKey, member temp storage key
 */
function _importMembers(members, redisKey) {
    return RedisClient.multi()
        .sadd(redisKey, members)
        .expire(redisKey, GLOBAL_KEY_EXPIRE_TIME_IN_SECONDS)
        .execAsync();
}

/**
 * @Author: George_Chen
 * @Description: extend the timeout for specific member list
 *
 * @param {String}      redisKey, member temp storage key
 */
function _ttlMemberList(redisKey) {
    return RedisClient.expireAsync(redisKey, GLOBAL_KEY_EXPIRE_TIME_IN_SECONDS);
}
