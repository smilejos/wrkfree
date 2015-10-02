'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../sharedUtils/utils');
var LogUtils = require('../../sharedUtils/logUtils');
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
    return Promise.all([
        SharedUtils.argsCheckAsync(user1, 'md5'),
        SharedUtils.argsCheckAsync(user2, 'md5')
    ]).then(function(queryParams) {
        return Agent.execTransactionAsync([{
            text: 'INSERT INTO friends(owner, uid) VALUES($1, $2)',
            values: queryParams
        }, {
            text: 'INSERT INTO friends(owner, uid) VALUES($2, $1)',
            values: queryParams
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
    return Promise.all([
        SharedUtils.argsCheckAsync(user1, 'md5'),
        SharedUtils.argsCheckAsync(user2, 'md5')
    ]).then(function(queryParams) {
        return Agent.execTransactionAsync([{
            text: 'DELETE FROM friends WHERE owner=$1 AND uid=$2',
            values: queryParams
        }, {
            text: 'DELETE FROM friends WHERE owner=$2 AND uid=$1',
            values: queryParams
        }]);
    }).catch(function(err) {
        LogUtils.error(LogCategory, {
            args: SharedUtils.getArgs(arguments),
            error: err.toString()
        }, 'error in PgFriend.deleteFriendshipAsync()');
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
