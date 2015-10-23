'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../sharedUtils/utils');
var LogUtils = require('../../sharedUtils/logUtils');
var LogCategory = 'STORAGE';
var Agent = require('../pgAgent');

var AUTH_CHANNEL_QUERY_NUMBER = 30;

/**
 * Public API
 * @Author: George_Chen
 * @Description: add member to the current channel
 *
 * @param {String}          member, the member uid
 * @param {String}          channelId, channel id
 */
exports.addAsync = function(member, channelId) {
    return Promise.join(
        SharedUtils.argsCheckAsync(member, 'md5'),
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        function(uid, cid) {
            var sqlQuery = {
                text: 'INSERT INTO members(member, "channelId", "msgSeenTime", "lastVisitTime") ' +
                    'VALUES($1, $2, $3, $3) RETURNING * ',
                values: [uid, cid, new Date(0)]
            };
            return Agent.execSqlAsync(sqlQuery).then(function(result) {
                return result[0];
            });
        }).catch(function(err) {
            LogUtils.error(LogCategory, {
                args: SharedUtils.getArgs(arguments),
                error: err.toString()
            }, 'error in PgMember.addAsync()');
            throw err;
        });
};

/**
 * Public API: TBD
 * @Author: George_Chen
 * @Description: to remove member from the current channel
 *
 * @param {String}  member, the member's id
 * @param {String}  channelId, the channel identifier
 */
exports.removeAsync = function(member, channelId) {
    return Promise.all([
        SharedUtils.argsCheckAsync(member, 'md5'),
        SharedUtils.argsCheckAsync(channelId, 'md5')
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'DELETE FROM members WHERE "member"=$1 AND "channelId"=$2',
            values: queryParams
        };
        return Agent.execSqlAsync(sqlQuery);
    }).catch(function(err) {
        LogUtils.error(LogCategory, {
            args: SharedUtils.getArgs(arguments),
            error: err.toString()
        }, 'error in PgMember.removeAsync()');
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to find the specific member status
 *
 * @param {String}      member, member's id
 * @param {String}      channelId, channel's id
 */
exports.findMemberAsync = function(member, channelId) {
    return Promise.all([
        SharedUtils.argsCheckAsync(member, 'md5'),
        SharedUtils.argsCheckAsync(channelId, 'md5')
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'SELECT * FROM members WHERE "member"=$1 AND "channelId"=$2',
            values: queryParams
        };
        return Agent.proxySqlAsync(sqlQuery).then(function(result) {
            return (result[0] ? _transformTime(result[0]) : result[0]);
        });
    }).catch(function(err) {
        LogUtils.error(LogCategory, {
            args: SharedUtils.getArgs(arguments),
            error: err.toString()
        }, 'error in PgMember.findMemberAsync()');
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for member to get his status on all channels that he has ever been authed
 *
 * @param {String}          member, member's id
 * @param {Boolean}         is1on1, to find 1on1 channels or not
 * @param {Object}          visitTime, the visit timestamp (optional)
 */
exports.findByUidAsync = function(member, is1on1, visitTime) {
    return Promise.all([
        SharedUtils.argsCheckAsync(member, 'md5'), 
        !!is1on1, // indicate is1on1 is false
        AUTH_CHANNEL_QUERY_NUMBER,
        SharedUtils.isNumber(visitTime) ? new Date(visitTime) : new Date()
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'SELECT * FROM members WHERE "member"=$1 AND "is1on1"=$2 ' +
                'AND "lastVisitTime" <$4 ' +
                'ORDER BY "lastVisitTime" DESC ' +
                'LIMIT $3',
            values: queryParams
        };
        return _find(sqlQuery, 'findByUidAsync');
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to find user's member status on his 1on1 channels
 *
 * @param {String}      member, member's uid
 */
exports.findIn1on1Async = function(member) {
    return Promise.all([
        SharedUtils.argsCheckAsync(member, 'md5'),
        true // indicate is1on1 is true
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'SELECT * FROM members WHERE "member"=$1 AND "is1on1"=$2 ',
            values: queryParams
        };
        return _find(sqlQuery, 'findIn1on1Async');
    });
};

/**
 * Public API: TBD
 * @Author: George_Chen
 * @Description: find user's member status all channels that he has ever created
 *
 * @param {String}      host, host's id
 */
exports.findHostsAsync = function(host) {
    return Promise.all([
        SharedUtils.argsCheckAsync(host, 'md5'),
        true // indicate isHost is true
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'SELECT * FROM members WHERE "member"=$1 AND "isHost"=$2',
            values: queryParams
        };
        return _find(sqlQuery, 'findHostsAsync');
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: find user's member status on all channels that he starred
 *
 * @param {String}      member, member's uid
 */
exports.findStarsAsync = function(member) {
    return Promise.all([
        SharedUtils.argsCheckAsync(member, 'md5'),
        false, // indicate is1on1 is false
        true // indicate isStarred is true
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'SELECT * FROM members WHERE "member"=$1 AND "is1on1"=$2 AND "isStarred"=$3',
            values: queryParams
        };
        return _find(sqlQuery, 'findStarsAsync');
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: find all members on the current channel
 *
 * @param {String}          channelId, channel id
 */
exports.findInChannelAsync = function(channelId) {
    return Promise.all([
        SharedUtils.argsCheckAsync(channelId, 'md5')
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'SELECT * FROM members WHERE "channelId"=$1',
            values: queryParams
        };
        return _find(sqlQuery, 'findInChannelAsync');
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: check the channel member is exist or not
 *
 * @param {String}      member, member's id
 * @param {String}      channelId, channel's id
 */
exports.isExistAsync = function(member, channelId) {
    return Promise.all([
        SharedUtils.argsCheckAsync(member, 'md5'),
        SharedUtils.argsCheckAsync(channelId, 'md5')
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'SELECT CAST(COUNT(id) as INTEGER) FROM members ' +
                'WHERE "member"=$1 AND "channelId"=$2',
            values: queryParams
        };
        return _isExist(sqlQuery, 'isExistAsync');
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: check member has starred the current channel or not
 *
 * @param {String}      member, member's id
 * @param {String}      channelId, channel's id
 */
exports.isStarredAsync = function(member, channelId) {
    return Promise.all([
        SharedUtils.argsCheckAsync(member, 'md5'),
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        true // indicate isStarred is true
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'SELECT CAST(COUNT(id) as INTEGER) FROM members ' +
                'WHERE "member"=$1 AND "channelId"=$2 AND "isStarred"=$3',
            values: queryParams
        };
        return _isExist(sqlQuery, 'isStarredAsync');
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: check member is the channel host or not
 *
 * @param {String}      member, member's id
 * @param {String}      channelId, channel's id
 */
exports.isHostAsync = function(member, channelId) {
    return Promise.all([
        SharedUtils.argsCheckAsync(member, 'md5'),
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        true // indicate isHost is true
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'SELECT CAST(COUNT(id) as INTEGER) FROM members ' +
                'WHERE "member"=$1 AND "channelId"=$2 AND "isHost"=$3',
            values: queryParams
        };
        return _isExist(sqlQuery, 'isHostAsync');
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: update member's msg seen status
 *
 * @param {String}      member, member's id
 * @param {String}      channelId, channel's id
 */
exports.updateMsgAsync = function(member, channelId) {
    return Promise.join(
        SharedUtils.argsCheckAsync(member, 'md5'),
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        function(uid, cid) {
            var sqlQuery = {
                text: 'UPDATE members set "msgSeenTime"=$1 WHERE "member"=$2 AND "channelId"=$3',
                values: [new Date(), uid, cid]
            };
            return Agent.execSqlAsync(sqlQuery);
        }).catch(function(err) {
            LogUtils.error(LogCategory, {
                args: SharedUtils.getArgs(arguments),
                error: err.toString()
            }, 'error in PgMember.updateMsgAsync()');
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to update the channel visit information
 *
 * @param {String}      member, member's id
 * @param {String}      channelId, channel's id
 */
exports.updateVisitAsync = function(member, channelId) {
    return Promise.join(
        SharedUtils.argsCheckAsync(member, 'md5'),
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        function(uid, cid) {
            var sqlQuery = {
                text: 'UPDATE members set "lastVisitTime"=$1 WHERE "member"=$2 AND "channelId"=$3',
                values: [new Date(), uid, cid]
            };
            return Agent.execSqlAsync(sqlQuery);
        }).catch(function(err) {
            LogUtils.error(LogCategory, {
                args: SharedUtils.getArgs(arguments),
                error: err.toString()
            }, 'error in PgMember.updateVisitAsync()');
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: update the starred status on the current member
 *
 * @param {String}      member, member's id
 * @param {String}      channelId, channel's id
 * @param {Boolean}     state, starred status
 */
exports.updateStarredAsync = function(member, channelId, state) {
    return Promise.all([
        SharedUtils.argsCheckAsync(state, 'boolean'),
        SharedUtils.argsCheckAsync(member, 'md5'),
        SharedUtils.argsCheckAsync(channelId, 'md5')
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'UPDATE members set "isStarred"=$1 WHERE "member"=$2 AND "channelId"=$3',
            values: queryParams
        };
        return Agent.execSqlAsync(sqlQuery);
    }).catch(function(err) {
        LogUtils.error(LogCategory, {
            args: SharedUtils.getArgs(arguments),
            error: err.toString()
        }, 'error in PgMember.updateStarredAsync()');
        throw err;
    });
};

/**
 * @Author: George_Chen
 * @Description: to execute low-level exist check operation
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
        }, 'error in PgMember.' + caller + '()');
        throw err;
    });
}

/**
 * @Author: George_Chen
 * @Description: to execute low-level find operation
 *
 * @param {Object}          sqlQuery, the pg sql query object
 * @param {String}          caller, the caller function name
 */
function _find(sqlQuery, caller) {
    return Agent.proxySqlAsync(sqlQuery)
        .map(function(item) {
            return _transformTime(item);
        }).catch(function(err) {
            LogUtils.error(LogCategory, {
                args: SharedUtils.getArgs(arguments),
                error: err.toString()
            }, 'error in PgMember.' + caller + '()');
            throw err;
        });
}

/**
 * @Author: George_Chen
 * @Description: to transform date field on member docurment into timestamp
 *
 * @param {Object}          item, the member record info
 */
function _transformTime(item) {
    item.msgSeenTime = item.msgSeenTime instanceof Date ? 
        item.msgSeenTime.getTime() : 
        item.msgSeenTime;
    item.lastVisitTime = item.lastVisitTime instanceof Date ? 
        item.lastVisitTime.getTime() : 
        item.lastVisitTime;
    return item;
}
