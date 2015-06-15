'use strict';
var Promise = require('bluebird');
var Redis = require('redis');
var SharedUtils = require('../../sharedUtils/utils');
var Configs = require('../../configs/config');

/**
 * setup rtc params
 */
var Params = Configs.get().params.rtc;
if (!Params) {
    throw new Error('can not get rtc params');
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
 * @Description: set the current channel's rtc session
 *         NOTE: a client is a socketId
 *
 * @param {String}      channelId, channel id
 * @param {Object}      session, channel rtc session
 * @param {Array}       session.clients, clients that join the rtc session
 * @param {Object}      session.sdps, sdps of each joined clients
 */
exports.setAsync = function(channelId, session) {
    return Promise.join(
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        SharedUtils.argsCheckAsync(session.clients, 'array'),
        _checkSdp(session.sdps),
        function(cid) {
            var redisKey = _getSessionKey(cid);
            var expiredTime = Params.sessionTimeoutInSecond;
            var rawSession = JSON.stringify(session);
            return RedisClient.setexAsync(redisKey, expiredTime, rawSession);
        }).catch(function(err) {
            SharedUtils.printError('rtcSessionTemp.js', 'setAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: get rtc session of current channel
 *
 * @param {String}      channelId, channel id
 */
exports.getAsync = function(channelId) {
    return SharedUtils.argsCheckAsync(channelId, 'md5')
        .then(function(cid) {
            var redisKey = _getSessionKey(cid);
            return RedisClient.getAsync(redisKey);
        }).then(function(rawSession) {
            return JSON.parse(rawSession);
        }).catch(function(err) {
            SharedUtils.printError('rtcSessionTemp.js', 'getAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: get sdps of channel rtc session
 *
 * @param {String}      channelId, channel id
 */
exports.deleteAsync = function(channelId) {
    return SharedUtils.argsCheckAsync(channelId, 'md5')
        .then(function(cid) {
            var redisKey = _getSessionKey(cid);
            return RedisClient.delAsync(redisKey);
        }).catch(function(err) {
            SharedUtils.printError('rtcSessionTemp.js', 'delAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: set the rtc session timeout value
 *
 * @param {String}      channelId, channel id
 */
exports.ttlAsync = function(channelId) {
    return SharedUtils.argsCheckAsync(channelId, 'md5')
        .then(function(cid) {
            var redisKey = _getSessionKey(cid);
            return RedisClient.expireAsync(
                redisKey,
                Params.sessionTimeoutInSecond
            );
        }).catch(function(err) {
            SharedUtils.printError('rtcSessionTemp.js', 'delAsync', err);
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
 * @Description: to get the redis key for rtc session
 *
 * @param {String}   cid, channel id
 */
function _getSessionKey(cid) {
    return 'channel:' + cid + ':rtc:session';
}

/**
 * @Author: George_Chen
 * @Description: check the sdp props is valid or not
 *
 * @param {Object}      sdp, session's sdp
 */
function _checkSdp(sdp) {
    var sessionUids = Object.keys(sdp);
    SharedUtils.fastArrayMap(sessionUids, function(uid) {
        var props = ['video', 'audio', 'screen'];
        SharedUtils.fastArrayMap(props, function(prop) {
            if (!SharedUtils.isBoolean(sdp[uid][prop])) {
                throw new Error('abnormal sdp prop');
            }
        });
    });
    return sdp;
}
