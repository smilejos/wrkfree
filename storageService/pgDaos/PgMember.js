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
            return _set(sqlQuery, 'addAsync');
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
        return _set(sqlQuery, 'removeAsync');
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
 * @param {Object}          visitTime, the visit timestamp (optional)
 */
exports.findByUidAsync = function(member, visitTime) {
    return Promise.all([
        SharedUtils.argsCheckAsync(member, 'md5'),
        false, // indicate is1on1 is false
        AUTH_CHANNEL_QUERY_NUMBER,
        SharedUtils.isNumber(visitTime) ? new Date(visitTime) : new Date()
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'SELECT ' +
                'm."channelId", c.name as "channelName", c.host as "hostUid",u.avatar as "hostAvatar", ' +
                ' u."givenName" || u."familyName" as "hostName", m."isStarred", m."lastVisitTime" ' +
                'FROM members m, channels c ' +
                'LEFT JOIN users u on c.host = u.uid ' +
                'WHERE ' +
                'm."member"=$1 AND m."is1on1"=$2 AND m."lastVisitTime"<$4 AND m."channelId" = c.id ' +
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
            text: 'SELECT m."channelId", c.name, c.host ' +
                'FROM members m ' +
                'LEFT JOIN channels c on m."channelId" = c.id ' +
                'WHERE m."member"=$1 AND m."is1on1"=$2 AND m."isStarred"=$3',
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
            text: 'SELECT u.uid, u."givenName" || u."familyName" as "nickName", u.avatar ' +
                'FROM members m ' +
                'LEFT JOIN users u on m.member = u.uid ' +
                'WHERE m."channelId"=$1 ',
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
 * @Description: update message status on current channel members 
 *               who have starred current channel.
 *         NOTE: should only triggered when new message has been saved to db
 *
 * @param {String}      sender, message sender uid
 * @param {String}      channelId, channel's id
 */
exports.newMsgStateAsync = function(sender, channelId) {
    return Promise.join(
        SharedUtils.argsCheckAsync(sender, 'md5'),
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        function(uid, cid) {
            return Agent.execTransactionAsync([{
                text: 'UPDATE members SET "unreadMsgCounts"="unreadMsgCounts"+1 ' +
                    'WHERE "channelId"=$1 AND "isStarred"=$2 AND "msgSeenTime" < CURRENT_TIMESTAMP',
                values: [cid, true]
            }, {
                text: 'UPDATE members SET "unreadMsgCounts"=$1, "msgSeenTime"=CURRENT_TIMESTAMP ' +
                    'WHERE "member"=$2 AND "channelId"=$3 AND "isStarred"=$4',
                values: [0, uid, cid, true]
            }]);
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: reset message status on specific channel member
 *               who has starred the current channel
 *
 * @param {String}      member, member's id
 * @param {String}      channelId, channel's id
 */
exports.resetMsgStateAsync = function(member, channelId) {
    return Promise.all([
        SharedUtils.argsCheckAsync(member, 'md5'),
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        true, // indicate "isStarred" is true,
        0 // update "unreadMsgCounts" to 0
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'UPDATE members SET "unreadMsgCounts"=$4, "msgSeenTime"=CURRENT_TIMESTAMP ' +
                'WHERE member=$1 AND "channelId"=$2 AND "isStarred"=$3',
            values: queryParams
        };
        return _set(sqlQuery, 'resetMsgStateAsync');
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
            return _set(sqlQuery, 'updateVisitAsync');
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
        SharedUtils.argsCheckAsync(member, 'md5'),
        SharedUtils.argsCheckAsync(channelId, 'md5'),
        SharedUtils.argsCheckAsync(state, 'boolean'),
        0 // update "unreadMsgCounts" to 0
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'UPDATE members set "isStarred"=$3, "unreadMsgCounts"=$4, "msgSeenTime"=CURRENT_TIMESTAMP ' +
                'WHERE "member"=$1 AND "channelId"=$2',
            values: queryParams
        };
        return _set(sqlQuery, 'updateStarredAsync');
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
 * @Description: to execute update or create operation
 *
 * @param {Object}          sqlQuery, the pg sql query object
 * @param {String}          caller, the caller function name
 */
function _set(sqlQuery, caller) {
    return Agent.execSqlAsync(sqlQuery).then(function(result) {
        return result[0];
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
    if (item.msgSeenTime instanceof Date) {
        item.msgSeenTime = item.msgSeenTime.getTime();
    }
    if (item.lastVisitTime instanceof Date) {
        item.lastVisitTime = item.lastVisitTime.getTime();
    }
    return item;
}
