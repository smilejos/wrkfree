'use strict';
var SharedUtils = require('../../sharedUtils/utils');
var Configs = require('../configs');
var Promise = require('bluebird');
var UserDao = require('../daos/UserDao');
var UserTemp = require('../tempStores/UserTemp');

/************************************************
 *
 *           Public APIs
 *
 ************************************************/

/**
 * Public API
 * @Author: George_Chen
 * @Description: to sign up an user account
 *
 * @param {Object} userInfo, user information object
 */
exports.addUserAsync = function(userInfo) {
    return Promise.try(function() {
        return UserDao.isUserExistAsync(userInfo.email);
    }).then(function(exist) {
        return (exist ? new Error('user is exist') : UserDao.addNewUserAsync(userInfo));
    }).catch(function(err) {
        SharedUtils.printError('UserService', 'addUserAsync', err);
        throw err;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: vertify this client and return his info if success
 *
 * @param {String} clientId, oAuthId of this client
 * @param {String} provider, oAuth provider
 */
exports.oAuthLoginAsync = function(clientId, provider) {
    return UserDao.findByOAuthAsync(clientId, provider)
        .then(function(userInfo) {
            if (!userInfo) {
                return null;
            }
            return {
                email: userInfo.email,
                name: userInfo.nickName
            };
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to find specifc user by partial of his name
 *
 * @param {String}      findString, the string used to find user
 */
exports.findUsersAsync = function(findString) {
    return UserDao.findByNameAsync(findString);
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to check sepcific user is exist or not
 *
 * @param {String}      uid, user id
 */
exports.isUserExistAsync = function(uid) {
    return UserDao.isUserExistAsync(uid)
        .catch(function(err) {
            SharedUtils.printError('UserService', 'isUserExistAsync', err);
            throw err;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to find out the information of specific user
 *
 * @param {String/Array}      user, an user id or an array of users
 */
exports.getUserAsync = function(user) {
    return Promise.try(function() {
        if (SharedUtils.isArray(user)) {
            return UserDao.findByGroupAsync(user);
        }
        if (SharedUtils.isEmail(user)) {
            return UserDao.findByUidAsync(user);
        }
        throw new Error('not an valid user');
    }).catch(function(err) {
        SharedUtils.printError('UserService', 'getUserAsync', err);
        return null;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: check user already got auth or not based on web session
 *
 * @param  {String}           uid, user's id
 * @param  {String}           sid, user's web session id
 */
exports.isUserSessionAuthAsync = function(user, sid) {
    return UserTemp.getWebSessionAsync(user, sid)
        .then(function(rawInfo) {
            return (user === JSON.parse(rawInfo).passport.user.email);
        }).catch(function(err) {
            SharedUtils.printError('UserService', 'getSessAuthAsync', err);
            return false;
        });
};
