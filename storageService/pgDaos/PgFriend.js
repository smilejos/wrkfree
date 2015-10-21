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
 * @Description: get the friend list of owner
 * 
 * @param {String}      owner, the owner's uid
 */
exports.getFriendsAsync = function(owner) {
    return Promise.all([
        SharedUtils.argsCheckAsync(owner, 'md5')
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'SELECT * FROM friends WHERE "owner"=$1',
            values: queryParams
        };
        return Agent.proxySqlAsync(sqlQuery);
    }).catch(function(err) {
        LogUtils.error(LogCategory, {
            args: SharedUtils.getArgs(arguments),
            error: err.toString()
        }, 'error in PgFriend.getFriendsAsync()');
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: add friendship between user1 and user2
 * 
 * @param {String}      user1, the user1's uid
 * @param {String}      user2, the user2's uid
 */
exports.addFriendshipAsync = function(user1, user2) {
    return Promise.join(
        SharedUtils.argsCheckAsync(user1, 'md5'),
        SharedUtils.argsCheckAsync(user2, 'md5'),
        function(uid1, uid2) {
            var hosts = SharedUtils.get1on1ChannelHost(uid1, uid2);
            var cid = CryptoUtils.getMd5Hex(hosts);
            return Agent.execTransactionAsync([{
                text: 'INSERT INTO friends(owner, uid) VALUES($1, $2)',
                values: [uid1, uid2]
            }, {
                text: 'INSERT INTO friends(owner, uid) VALUES($1, $2)',
                values: [uid2, uid1]
            }, {
                text: 'INSERT INTO channels(id, host, name, "is1on1") ' +
                    'VALUES($1, $2, $3, $4)',
                values: [cid, hosts, '', true]
            }, {
                text: 'INSERT INTO drawBoards("channelId") VALUES($1)',
                values: [cid]
            }, {
                text: 'INSERT INTO members(member, "channelId", "isStarred", "is1on1", "isHost", "msgSeenTime", "lastVisitTime") ' +
                    'VALUES($1, $2, $3, $3, $3, $4, $4)',
                values: [uid1, cid, true, new Date()]
            }, {
                text: 'INSERT INTO members(member, "channelId", "isStarred", "is1on1", "isHost", "msgSeenTime", "lastVisitTime") ' +
                    'VALUES($1, $2, $3, $3, $3, $4, $4)',
                values: [uid2, cid, true, new Date()]
            }]);
        }).catch(function(err) {
            LogUtils.error(LogCategory, {
                args: SharedUtils.getArgs(arguments),
                error: err.toString()
            }, 'error in PgFriend.addFriendshipAsync()');
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: delete friendship between user1 and user2
 * 
 * @param {String}      user1, the user1's uid
 * @param {String}      user2, the user2's uid
 */
exports.deleteFriendshipAsync = function(user1, user2) {
    return Promise.join(
        SharedUtils.argsCheckAsync(user1, 'md5'),
        SharedUtils.argsCheckAsync(user2, 'md5'),
        function(uid1, uid2) {
            var hosts = SharedUtils.get1on1ChannelHost(uid1, uid2);
            var cid = CryptoUtils.getMd5Hex(hosts);
            return Agent.execTransactionAsync([{
                text: 'DELETE FROM friends WHERE owner=$1 AND uid=$2',
                values: [uid1, uid2]
            }, {
                text: 'DELETE FROM friends WHERE owner=$1 AND uid=$2',
                values: [uid2, uid1]
            }, {
                text: 'DELETE FROM channels WHERE id=$1',
                values: [cid]
            }, {
                text: 'DELETE FROM drawBoards WHERE "channelId"=$1',
                values: [cid]
            }, {
                text: 'DELETE FROM drawRecords WHERE "channelId"=$1',
                values: [cid]
            }, {
                text: 'DELETE FROM members WHERE "channelId"=$1',
                values: [cid]
            }]);
        }).catch(function(err) {
            LogUtils.error(LogCategory, {
                args: SharedUtils.getArgs(arguments),
                error: err.toString()
            }, 'error in PgFriend.addFriendshipAsync()');
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: check owner has user as his friend or not
 * 
 * @param {String}      owner, the owner's uid
 * @param {String}      user, the user's uid
 */
exports.hasFriendAsync = function(owner, user) {
    return Promise.all([
        SharedUtils.argsCheckAsync(owner, 'md5'),
        SharedUtils.argsCheckAsync(user, 'md5')
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'SELECT CAST(COUNT(id) as INTEGER) FROM friends ' +
                'WHERE owner=$1 AND uid=$2',
            values: queryParams
        };
        return Agent.proxySqlAsync(sqlQuery).then(function(result) {
            return (result[0].count > 0);
        });
    }).catch(function(err) {
        LogUtils.error(LogCategory, {
            args: SharedUtils.getArgs(arguments),
            error: err.toString()
        }, 'error in PgFriend.hasFriendAsync()');
        throw err;
    });
};
