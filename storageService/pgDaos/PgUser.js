'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../sharedUtils/utils');
var CryptoUtils = require('../../sharedUtils/cryptoUtils');
var LogUtils = require('../../sharedUtils/logUtils');
var LogCategory = 'STORAGE';
var Agent = require('../pgAgent');


/**
 * currently oauth providers
 */
var OauthProviders = ['facebook', 'google'];

/**
 * Public API
 * @Author: George_Chen
 * @Description: for creating new user account
 *
 * @param {String}          userInfo, the new user infomation
 */
exports.createAsync = function(userInfo) {
    if (userInfo.gender !== 'male' && userInfo.gender !== 'female') {
        throw new Error('gender is invalid');
    }
    if (!SharedUtils.isNormalChar(userInfo.facebook) && !SharedUtils.isNormalChar(userInfo.google)) {
        throw new Error('oauth provider is invalid');
    }
    return Promise.all([
        CryptoUtils.getMd5Hex(userInfo.email),
        SharedUtils.argsCheckAsync(userInfo.email, 'email'),
        SharedUtils.argsCheckAsync(userInfo.givenName, 'givenName'),
        SharedUtils.argsCheckAsync(userInfo.familyName, 'familyName'),
        SharedUtils.argsCheckAsync(userInfo.avatar, 'avatar'),
        SharedUtils.argsCheckAsync(userInfo.locale, 'alphabet'),
        userInfo.facebook || '',
        userInfo.google || '',
        userInfo.gender
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'INSERT INTO users(uid, email, "givenName", "familyName", avatar, locale, facebook, google, gender) ' +
                'VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING * ',
            values: queryParams
        };
        return _set(sqlQuery, 'createAsync');
    }).then(function(result) {
        return _setNickname(result);
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: find the user by his uid
 *
 * @param {String}          uid, user's uid
 */
exports.findByIdAsync = function(uid, isLogin) {
    return Promise.all([
        SharedUtils.argsCheckAsync(uid, 'md5')
    ]).then(function(queryParams) {
        var fields = (isLogin ? '*' : 'uid, "givenName", "familyName", avatar ');
        var sqlQuery = {
            text: 'SELECT ' + fields + 'FROM users WHERE uid=$1',
            values: queryParams
        };
        return _findOne(sqlQuery, 'findByIdAsync');
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: use oauth id to find the user's info
 *
 * @param {String}          oAuthId, the oAuth valid id
 * @param {String}          provider, the oauth provider
 */
exports.findByOAuthAsync = function(oAuthId, provider) {
    return Promise.all([
        SharedUtils.argsCheckAsync(oAuthId, 'string')
    ]).then(function(queryParams) {
        if (OauthProviders.indexOf(provider) === -1) {
            throw new Error('oauth provider is not support now');
        }
        var sqlQuery = {
            text: 'SELECT * FROM users WHERE ' + provider + '=$1',
            values: queryParams
        };
        return _findOne(sqlQuery, 'findByOAuthAsync');
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: find users info in the current array of uids
 *
 * @param {Array}          uids, group of uids
 */
exports.findInIdsAsync = function(uids) {
    return Promise.try(function() {
        if (uids.length === 0) {
            return [];
        }
        var indices = [];
        var params = SharedUtils.fastArrayMap(uids, function(uid, index) {
            if (!SharedUtils.isMd5Hex(uid)) {
                throw new Error('invalid user id');
            }
            indices.push('$' + (index + 1));
            return uid;
        });
        var sqlQuery = {
            text: 'SELECT * FROM users WHERE uid IN ' +
                '(' + indices.join(',') + ')',
            values: params
        };
        return Agent.proxySqlAsync(sqlQuery).map(function(item) {
            return _setNickname(item);
        });
    }).catch(function(err) {
        LogUtils.error(LogCategory, {
            args: SharedUtils.getArgs(arguments),
            error: err.toString()
        }, 'error in PgUser.findInIdsAsync()');
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: check current email has been registered or not
 *
 * @param {String}          email, user's email
 */
exports.isEmailUsedAsync = function(email) {
    return Promise.all([
        SharedUtils.argsCheckAsync(email, 'email')
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'SELECT CAST(COUNT(uid) as INTEGER) FROM users WHERE email=$1',
            values: queryParams
        };
        return _isExist(sqlQuery, 'isEmailUsedAsync');
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to check tour guide is default hidden or not
 *
 * @param {String}          uid, the current user id
 */
exports.isDefaultTourHiddenAsync = function(uid) {
    return Promise.all([
        SharedUtils.argsCheckAsync(uid, 'md5'),
        true, // indicate isDefaultTourHidden is true
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'SELECT CAST(COUNT(uid) as INTEGER) FROM users WHERE uid=$1 AND "isDefaultTourHidden"=$2',
            values: queryParams
        };
        return _isExist(sqlQuery, 'isDefaultTourHiddenAsync');
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to update the unreadNoticeCounts field
 *
 * @param {String}          uid, user's uid
 * @param {Boolean}         isReset, to indicate reset field or not
 */
exports.setUnreadNoticeCountAsync = function(uid, isReset) {
    return SharedUtils.argsCheckAsync(uid, 'md5')
        .then(function(id) {
            if (isReset) {
                return _set({
                    text: 'UPDATE users SET "unreadNoticeCounts"=$1 WHERE uid=$2',
                    values: [0, id]
                }, 'setUnreadNoticeCountAsync');
            }
            return _set({
                text: 'UPDATE users SET "unreadNoticeCounts"="unreadNoticeCounts"+1 WHERE uid=$1',
                values: [id]
            }, 'setUnreadNoticeCountAsync');
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to update the user's isDashboardLayout field
 *
 * @param {String}          uid, the current user id
 * @param {Boolean}         data.isGridLayout, to indicate layout is grid or not
 */
exports.setLayoutAsync = function(uid, isGridLayout) {
    return Promise.all([
        SharedUtils.argsCheckAsync(isGridLayout, 'boolean'),
        SharedUtils.argsCheckAsync(uid, 'md5')
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'UPDATE users SET "isDashboardGrid"=$1 WHERE uid=$2',
            values: queryParams
        };
        return _set(sqlQuery, 'setLayoutAsync');
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: used to update user's defaut tour state
 *
 * @param {String}          uid, the current user id
 * @param {Boolean}         data.isHidden, to indicate tour is default hidden or not
 */
exports.setDefaultTourAsync = function(uid, isHidden) {
    return Promise.all([
        SharedUtils.argsCheckAsync(isHidden, 'boolean'),
        SharedUtils.argsCheckAsync(uid, 'md5')
    ]).then(function(queryParams) {
        var sqlQuery = {
            text: 'UPDATE users SET "isDefaultTourHidden"=$1 WHERE uid=$2',
            values: queryParams
        };
        return _set(sqlQuery, 'setDefaultTourAsync');
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
        }, 'error in PgUser.' + caller + '()');
        throw err;
    });
}

/**
 * @Author: George_Chen
 * @Description: to execute low-level find one operation
 *
 * @param {Object}          sqlQuery, the pg sql query object
 * @param {String}          caller, the caller function name
 */
function _findOne(sqlQuery, caller) {
    return Agent.proxySqlAsync(sqlQuery).then(function(result) {
        return (result[0] ? _setNickname(result[0]) : result[0]);
    }).catch(function(err) {
        LogUtils.error(LogCategory, {
            args: SharedUtils.getArgs(arguments),
            error: err.toString()
        }, 'error in PgUser.' + caller + '()');
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
        }, 'error in PgUser.' + caller + '()');
        throw err;
    });
}

/**
 * @Author: George_Chen
 * @Description: to set the user's nickName
 *
 * @param {Object}          item, the user object stored in db
 */
function _setNickname(item) {
    item.nickName = item.givenName + item.familyName;
    return item;
}
