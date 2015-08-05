'use strict';
var SharedUtils = require('../../sharedUtils/utils');
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
        return UserDao.isEmailUsedAsync(userInfo.email);
    }).then(function(exist) {
        if (exist) {
            throw new Error('user already exist');
        }
        return UserDao.addNewUserAsync(userInfo);
    }).catch(function(err) {
        SharedUtils.printError('UserService', 'addUserAsync', err);
        return null;
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
            return (!userInfo ? false : userInfo);
        }).catch(function(err) {
            SharedUtils.printError('UserService', 'oAuthLoginAsync', err);
            return null;
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
    return UserDao.findByNameAsync(findString)
        .catch(function(err) {
            SharedUtils.printError('UserService', 'findUsersAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to check sepcific email has been used or not
 *
 * @param {String}      uid, user id
 */
exports.isEmailUsedAsync = function(uid) {
    return UserDao.isEmailUsedAsync(uid)
        .catch(function(err) {
            SharedUtils.printError('UserService', 'isEmailUsedAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to reset unread notice on target user's header;
 *
 * @param {Object}          socket, the client socket instance
 */
exports.resetUnreadNoticeAsync = function(user) {
    return UserDao.setUnreadNoticeCountAsync(user, true)
        .catch(function(err) {
            SharedUtils.printError('UserService', 'resetUnreadNoticeAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to set the user's current dashboard layout
 *
 * @param {String}          user, the current user id
 * @param {Boolean}         data.isGrid, to indicate layout is grid or not
 */
exports.setDashboardLayoutAsync = function(user, isGrid) {
    return UserDao.setLayoutAsync(user, isGrid)
        .catch(function(err) {
            SharedUtils.printError('UserService', 'setDashboardLayoutAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to find out the information of specific user
 *
 * @param {String/Array}      user, an user id or an array of users
 */
exports.getUserAsync = function(user, isLogin) {
    return Promise.try(function() {
        if (SharedUtils.isArray(user)) {
            return UserDao.findByGroupAsync(user);
        }
        return UserDao.findByIdAsync(user, isLogin);
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
    return Promise.join(
        SharedUtils.argsCheckAsync(user, 'md5'),
        UserTemp.getWebSessionAsync(sid),
        function(validUid, rawSession) {
            return (validUid === JSON.parse(rawSession).passport.user.uid);
        }).catch(function(err) {
            SharedUtils.printError('UserService', 'getSessAuthAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: binding current socket and set to online status
 *
 * @param  {String}           uid, user's id
 */
exports.userEnterAsync = function(uid) {
    return UserTemp.enterAsync(uid)
        .catch(function(err) {
            SharedUtils.printError('UserService', 'userEnterAsync', err);
            return null;
        });
};
