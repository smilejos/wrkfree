'use strict';
var Redis = require('redis');
var Promise = require('bluebird');
var Configs = require('../configs/config');
var SharedUtils = require('../sharedUtils/utils');
var LogUtils = require('../sharedUtils/logUtils');
var DbConfigs = Configs.get().db;
var LogCategory = 'STORAGE';

/**
 * create a redis client
 */
var RedisClient = Redis.createClient(
    DbConfigs.cacheEnv.global.port,
    DbConfigs.cacheEnv.global.host,
    DbConfigs.cacheEnv.global.options);

/**
 * setup default data cache time in second
 */
var DEFAULT_CACHE_TIME_IN_SECOND = 5;

/**
 * Public API
 * @Author: George_Chen
 * @Description: get the cache data from cache server based on current queryHash
 * 
 * @param {String}      queryHash, the query hash string
 */
exports.getAsync = function(queryHash) {
    var cacheKey = _getCacheKey(queryHash);
    return RedisClient.getAsync(cacheKey)
        .then(function(data) {
            return (data ? JSON.parse(data) : null);
        }).catch(function(err) {
            LogUtils.error(LogCategory, {
                args: SharedUtils.getArgs(arguments),
                error: err.toString()
            }, 'error in pgCacher.getAsync()');
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: store the current cache data into cache server
 * 
 * @param {String}      queryHash, the query hash string
 * @param {Object}      cacheData, the candidate cache data
 * @param {Number}      ttl, the time to live of current cache data (in second)
 */
exports.setAsync = function(queryHash, cacheData, ttl) {
    return Promise.try(function() {
        var cacheKey = _getCacheKey(queryHash);
        var cacheTime = ttl ? ttl : DEFAULT_CACHE_TIME_IN_SECOND;
        var data = JSON.stringify(cacheData);
        return RedisClient.setexAsync(cacheKey, cacheTime, data);
    }).catch(function(err) {
        LogUtils.error(LogCategory, {
            args: SharedUtils.getArgs(arguments),
            error: err.toString()
        }, 'error in pgCacher.setAsync()');
        return null;
    });
};

/**
 * @Author: George_Chen
 * @Description: generate the cache key for cache server used.
 * 
 * @param {String}      queryHash, the query hash string
 */
function _getCacheKey(queryHash) {
    return 'pg:cache:' + queryHash;
}
