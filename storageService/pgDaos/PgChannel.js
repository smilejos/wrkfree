'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../sharedUtils/utils');
var LogUtils = require('../../sharedUtils/logUtils');
var CryptoUtils = require('../../sharedUtils/cryptoUtils');
var LogCategory = 'STORAGE';
var Agent = require('../pgAgent');


/**
 * Public API
 * @Author: George_Chen
 * @Description: create normal channel document
 *
 * @param {String}          creator, the creator uid
 * @param {String}          name, the channel name
 */
exports.createAsync = function(creator, channelName) {
    return Promise.join(
        SharedUtils.argsCheckAsync(creator, 'md5'),
        SharedUtils.argsCheckAsync(channelName, 'string'),
        function(uid, name) {
            var cid = CryptoUtils.getMd5Hex(creator + Date.now().toString());
            return Agent.execTransactionAsync([{
                text: 'INSERT INTO channels(id, host, name) ' +
                    'VALUES($1, $2, $3) RETURNING * ',
                values: [cid, uid, name]
            }, {
                text: 'INSERT INTO drawBoards("channelId") VALUES($1)',
                values: [cid]
            }, {
                text: 'INSERT INTO members(member, "channelId", "isStarred", "isHost", "msgSeenTime", "lastVisitTime") ' +
                    'VALUES($1, $2, $3, $3, $4, $4)',
                values: [uid, cid, true, new Date()]
            }]);
        }).then(function(transaction) {
            var info = transaction[0];
            info.channelId = info.id;
            return info;
        }).catch(function(err) {
            LogUtils.error(LogCategory, {
                args: SharedUtils.getArgs(arguments),
                error: err.toString()
            }, 'error in PgChannel.createAsync()');
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: used to check specific channel is created or not
 *
 * @param {String}          hostUid, host's uid
 * @param {String}          channelName, channel's name
 */
exports.isExistAsync = function(creator, name) {
    return Promise.all([
        SharedUtils.argsCheckAsync(creator, 'md5'),
        SharedUtils.argsCheckAsync(name, 'string')
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'SELECT CAST(COUNT(id) as INTEGER) FROM channels ' +
                'WHERE host=$1 AND name=$2',
            values: queryParams
        };
        return _isExist(sqlQuery, 'isExistAsync');
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: used to check channel is 1on1 channel or not
 *
 * @param {String}          channelId, the channel id
 */
exports.is1on1Async = function(channelId) {
    return Promise.all([
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        true, // is1on1=true for update
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'SELECT CAST(COUNT(id) as INTEGER) FROM channels ' +
                'WHERE id=$1 AND "is1on1"=$2',
            values: queryParams
        };
        return _isExist(sqlQuery, 'is1on1Async');
    });
};

/**
 * Public API: TBD
 * @Author: George_Chen
 * @Description: check channel has turned on the anonymousLogin or not
 *
 * @param {String}          channelId, channel id
 */
exports.isAnonymousLoginAsync = function(channelId) {
    return Promise.all([
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        true, // isAnonymousLoginAsync=true for checking
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'SELECT CAST(COUNT(id) as INTEGER) FROM channels ' +
                'WHERE id=$1 AND "isAnonymousLogin"=$2',
            values: queryParams
        };
        return _isExist(sqlQuery, 'isAnonymousLoginAsync');
    });
};

/**
 * Public API: TBD
 * @Author: George_Chen
 * @Description: for anonymous user to login channel
 *
 * @param {String}          channelId, channel id
 * @param {String}          password, the login password
 */
exports.anonymousLoginAsync = function(channelId, password) {
    return Promise.all([
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        SharedUtils.argsCheckAsync(password, 'string'),
        true, // isAnonymousLoginAsync=true for checking
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'SELECT CAST(COUNT(id) as INTEGER) FROM channels ' +
                'WHERE id=$1 AND "password"=$2 AND "isAnonymousLogin"=$3 ',
            values: queryParams
        };
        return _isExist(sqlQuery, 'isAnonymousLoginAsync');
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to find specific channel's document
 *
 * @param {String}          channelId, channel id
 */
exports.findByIdAsync = function(channelId) {
    return Promise.all([
        SharedUtils.argsCheckAsync(channelId, 'md5')
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'SELECT * FROM channels WHERE id=$1',
            values: queryParams
        };
        return Agent.proxySqlAsync(sqlQuery).then(function(result) {
            result[0].channelId = result[0].id;
            return result[0];
        });
    }).catch(function(err) {
        LogUtils.error(LogCategory, {
            args: SharedUtils.getArgs(arguments),
            error: err.toString()
        }, 'error in PgChannel.findByIdAsync()');
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to find channels based on give channelIds
 *
 * @param {String}          channelIds, an array of channelids
 */
exports.findInIdsAsync = function(channelIds) {
    return Promise.try(function() {
        if (channelIds.length === 0) {
            return [];
        }
        var indices = [];
        var params = SharedUtils.fastArrayMap(channelIds, function(cid, index) {
            if (!SharedUtils.isMd5Hex(cid)) {
                throw new Error('invalid channel id');
            }
            indices.push('$' + (index + 1));
            return cid;
        });
        var sqlQuery = {
            text: 'SELECT * FROM channels WHERE id IN ' +
                '(' + indices.join(',') + ')',
            values: params
        };
        return Agent.proxySqlAsync(sqlQuery).map(function(item) {
            item.channelId = item.id;
            return item;
        });
    }).catch(function(err) {
        LogUtils.error(LogCategory, {
            args: SharedUtils.getArgs(arguments),
            error: err.toString()
        }, 'error in PgChannel.findInIdsAsync()');
        throw err;
    });
};

/**
 * @Author: George_Chen
 * @Description: to check specific sql query object is exist or not
 *
 * @param {Object}          sqlQuery, the pg sql query object
 * @param {String}          caller, the caller function name
 */
function _isExist(sqlQuery, caller) {
    return Agent.proxySqlAsync(sqlQuery).then(function(result) {
        return (result[0].count > 0);
    }).catch(function(err) {
        LogUtils.error(LogCategory, {
            args: SharedUtils.getArgs(arguments),
            error: err.toString()
        }, 'error in PgChannel.' + caller + '()');
        throw err;
    });
}
