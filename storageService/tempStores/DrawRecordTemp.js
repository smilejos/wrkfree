'use strict';
var Promise = require('bluebird');
var Redis = require('redis');
var SharedUtils = require('../../sharedUtils/utils');
var DrawUtils = require('../../sharedUtils/drawUtils');

var Configs = require('../../configs/config');
var DbConfigs = Configs.get().db;
if (!DbConfigs) {
    throw new Error('DB configurations broken');
}

// TODO: these args should be put at a params configured files
var RECORD_DATA_LIMIT = 300;
// if no streams arrived within 2 second, stream raw data will be expired
var RECORD_STREAM_EXPIRE_TIME_IN_SECONDS = 2;

/**
 * stream record data should be put at local scope
 */
var RedisClient = Redis.createClient(
    DbConfigs.cacheEnv.local.port,
    DbConfigs.cacheEnv.local.host,
    DbConfigs.cacheEnv.local.options);

/**
 * Public API
 * @Author: George_Chen
 * @Description: for drawer to stream rawData into record temp store
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 * @param {String}          clientId, the draw client sid
 * @param {Array}           rawData, the record raw data          
 */
exports.streamRecordAsync = function(channelId, boardId, clientId, rawData) {
    return Promise.join(
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        SharedUtils.argsCheckAsync(boardId, 'boardId'),
        SharedUtils.argsCheckAsync(clientId, 'string'),
        DrawUtils.checkDrawChunksAsync(rawData),
        function(cid, bid, uid, chunks) {
            var streamKey = _getStreamKey(cid, bid, uid);
            return Promise.props({
                pushLength: RedisClient.rpushAsync(streamKey, _serializeChunks(chunks)),
                ttlResult: RedisClient.expireAsync(streamKey, RECORD_STREAM_EXPIRE_TIME_IN_SECONDS)
            });
        }).then(function(data) {
            if (data.pushLength > RECORD_DATA_LIMIT) {
                throw new Error('record stream exceed limit');
            }
            return (data.pushLength > 0 ? true : null);
        }).catch(function(err) {
            SharedUtils.printError('DrawTemp.js', 'streamRecordAsync', err);
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to get the full draw record data stored at record temp store
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 * @param {String}          clientId, the draw client sid
 */
exports.getRecordAsync = function(channelId, boardId, clientId) {
    return Promise.join(
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        SharedUtils.argsCheckAsync(boardId, 'boardId'),
        SharedUtils.argsCheckAsync(clientId, 'string'),
        function(cid, bid, uid) {
            var streamKey = _getStreamKey(cid, bid, uid);
            return RedisClient.lrangeAsync(streamKey, 0, RECORD_DATA_LIMIT);
        }).map(function(chunks) {
            return _deserializeChunks(chunks);
        }).catch(function(err) {
            SharedUtils.printError('DrawTemp.js', 'getRecordAsync', err);
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to clean out the drawer dependent record data on temp store
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 * @param {String}          drawer, drawer's uid
 */
exports.initDrawStreamAsync = function(channelId, boardId, drawer) {
    return Promise.join(
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        SharedUtils.argsCheckAsync(boardId, 'boardId'),
        SharedUtils.argsCheckAsync(drawer, 'md5'),
        function(cid, bid, uid) {
            var streamKey = _getStreamKey(cid, bid, uid);
            return RedisClient.delAsync(streamKey);
        }).catch(function(err) {
            SharedUtils.printError('DrawTemp.js', 'getRecordAsync', err);
            throw err;
        });
};

/**
 * @Author: George_Chen
 * @Description: to serialize record data
 *
 * @param {Array}          rawData, record raw data
 */
function _serializeChunks(rawData) {
    return JSON.stringify({
        data: rawData
    });
}

/**
 * @Author: George_Chen
 * @Description: to deserialize record data chunks
 *
 * @param {String}          serializedChunks, serialized chunks string
 */
function _deserializeChunks(serializedChunks) {
    return JSON.parse(serializedChunks).data;
}

/**
 * @Author: George_Chen
 * @Description: 
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 * @param {String}          drawer, drawer's uid
 */
function _getStreamKey(channelId, boardId, uid) {
    return 'draw:' + channelId + ':' + boardId + ':' + uid;
}
