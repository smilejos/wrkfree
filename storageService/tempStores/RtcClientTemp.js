'use strict';
var Promise = require('bluebird');
var Redis = require('redis');
var SharedUtils = require('../../sharedUtils/utils');
var Configs = require('../../configs/config');

/**
 * setup rtc params
 */
var SDP_TIMEOUT_IN_SECOND = Configs.get().params.rtc.sdpTimeoutInSecond;
if (!SharedUtils.isNumber(SDP_TIMEOUT_IN_SECOND)) {
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
 * @Description: to set current client's session sdp
 *
 * @param {String}      channelId, channel id
 * @param {String}      clientId, the client socket id
 * @param {Object}      sessionSdp, the client sdp
 */
exports.setSdpAsync = function(channelId, clinetId, sessionSdp) {
    return Promise.join(
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        SharedUtils.argsCheckAsync(clinetId, 'string'),
        _checkSdp(sessionSdp),
        function(cid, client, sdp) {
            var redisKey = _getClientKey(cid, client);
            var rawSdp = JSON.stringify(sdp);
            return RedisClient.setexAsync(redisKey, SDP_TIMEOUT_IN_SECOND, rawSdp);
        }).catch(function(err) {
            SharedUtils.printError('RtcClientTemp.js', 'setSdpAsync', err);
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to get session sdps of current requested clients
 *
 * @param {String}      channelId, channel id
 * @param {Array}       targetClients, an array of target clients
 */
exports.getSdpsAsync = function(channelId, targetClients) {
    return Promise.join(
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        _checkClientIds(targetClients),
        function(cid, clientIds) {
            if (clientIds.length === 0) {
                return [];
            }
            var memberKeys = SharedUtils.fastArrayMap(clientIds, function(client) {
                return _getClientKey(cid, client);
            });
            return RedisClient.mgetAsync(memberKeys);
        }).map(function(rawSdp) {
            return (rawSdp ? JSON.parse(rawSdp) : null);
        }).catch(function(err) {
            SharedUtils.printError('RtcClientTemp.js', 'getSdpsAsync', err);
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to keep rtc client sdp still alive.
 *
 * @param {String}      channelId, channel id
 * @param {String}      clientId, the client socket id
 */
exports.keepAliveAsync = function(channelId, clientId) {
    return Promise.join(
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        SharedUtils.argsCheckAsync(clientId, 'string'),
        function(cid, client) {
            var redisKey = _getClientKey(cid, client);
            return RedisClient.expireAsync(redisKey, SDP_TIMEOUT_IN_SECOND);
        }).catch(function(err) {
            SharedUtils.printError('RtcClientTemp.js', 'keepAliveAsync', err);
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to counts alive clients on the given targetClients
 *
 * @param {String}      channelId, channel id
 * @param {Array}       targetClients, an array of target clients
 */
exports.getAliveCountsAsync = function(channelId, targetClients) {
    return Promise.join(
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        _checkClientIds(targetClients),
        function(cid, clientIds) {
            var memberKeys = SharedUtils.fastArrayMap(clientIds, function(client) {
                return _getClientKey(cid, client);
            });
            return RedisClient.mgetAsync(memberKeys);
        }).reduce(function(total, getResult) {
            return (getResult ? total + 1 : total);
        }, 0).catch(function(err) {
            SharedUtils.printError('RtcClientTemp.js', 'getAliveCountsAsync', err);
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
 * @Description: to validate the targetClients array
 *
 * @param {Array}       targetClients, an array of target clients
 */
function _checkClientIds(targetClients) {
    return Promise.map(targetClients, function(clientId) {
        return SharedUtils.argsCheckAsync(clientId, 'string');
    });
}

/**
 * @Author: George_Chen
 * @Description: to get the redis key based on current client and channel
 *
 * @param {String}      cid, channel id
 * @param {String}      client, the client socket id
 */
function _getClientKey(cid, client) {
    return 'channel:' + cid + ':rtc:' + client;
}

/**
 * @Author: George_Chen
 * @Description: check the sdp props is valid or not
 *
 * @param {Object}      sdp, session's sdp
 */
function _checkSdp(sdp) {
    var props = ['video', 'audio', 'screen'];
    SharedUtils.fastArrayMap(props, function(prop) {
        if (!SharedUtils.isBoolean(sdp[prop])) {
            throw new Error('abnormal sdp prop');
        }
    });
    return sdp;
}
