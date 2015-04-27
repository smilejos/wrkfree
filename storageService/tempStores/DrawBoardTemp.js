'use strict';
var Promise = require('bluebird');
var Redis = require('redis');
var Configs = require('../configs');
var SharedUtils = require('../../sharedUtils/utils');

// TODO: these args should be put at a params configured files
var RECORD_ACTIVE_LIMIT = 10;
var RECORD_ACTIVE_EXPIRE_TIME = 300;

/**
 * board resource should be put at global scope
 */
var RedisClient = Redis.createClient(
    Configs.globalCacheEnv.port,
    Configs.globalCacheEnv.host,
    Configs.globalCacheEnv.options);

/**
 * Public API
 * @Author: George_Chen
 * @Description: to store the number of actived record on temp store
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 * @param {Number}          activeNum, the numbers of actived record
 */
exports.setActiveRecordNumAsync = function(channelId, boardId, activeNum) {
    return Promise.join(
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        SharedUtils.argsCheckAsync(boardId, 'boardId'),
        function(cid, bid) {
            if (activeNum > RECORD_ACTIVE_LIMIT) {
                throw new Error('active record number is invalid');
            }
            var activeRecordKey = _getActiveRecordKey(cid, bid);
            return RedisClient.setexAsync(activeRecordKey, RECORD_ACTIVE_EXPIRE_TIME, activeNum);
        }).catch(function(err) {
            SharedUtils.printError('DrawTemp.js', 'setActiveRecordsAsync', err);
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to get the number of actived record from temp store
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 */
exports.getActiveRecordNumAsync = function(channelId, boardId) {
    return Promise.join(
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        SharedUtils.argsCheckAsync(boardId, 'boardId'),
        function(cid, bid) {
            var activeRecordKey = _getActiveRecordKey(cid, bid);
            return RedisClient.getAsync(activeRecordKey);
        }).catch(function(err) {
            SharedUtils.printError('DrawTemp.js', 'setActiveRecordsAsync', err);
            throw err;
        });
};

/**
 * @Author: George_Chen
 * @Description: to get the actived record redis key on the current channel board
 *
 * @param {String}          channelId, channel id
 * @param {Number}          boardId, the draw board id
 */
function _getActiveRecordKey(channelId, boardId) {
    return 'draw:' + channelId + ':' + boardId + ':activeNum';
}
