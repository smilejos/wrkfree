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
            return userInfo;
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
exports.isEmailUsedAsync = function(uid) {
    return UserDao.isEmailUsedAsync(uid)
        .catch(function(err) {
            SharedUtils.printError('UserService', 'isEmailUsedAsync', err);
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
        return UserDao.findByIdAsync(user);
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
        return false;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: binding current socket and set to online status
 *
 * @param  {String}           uid, user's id
 * @param  {String}           socketId, websocket id
 */
exports.userEnterAsync = function(uid, socketId) {
    return Promise.all([
        UserTemp.bindSocketAsync(uid, socketId),
        UserTemp.enterAsync(uid),
    ]).catch(function(err) {
        SharedUtils.printError('UserService', 'userEnterAsync', err);
        return false;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: unbinding current socket and check user should be offline or not
 *
 * @param  {String}           uid, user's id
 * @param  {String}           socketId, websocket id
 */
exports.userLeaveAsync = function(uid, socketId) {
    return UserTemp.unbindSocketAsync(uid, socketId)
        .then(function() {
            return UserTemp.isSocketExistAsync(uid);
        }).then(function(socketExist) {
            return (socketExist ? null : UserTemp.leaveAsync(uid));
        }).catch(function(err) {
            SharedUtils.printError('UserService', 'userLeaveAsync', err);
            return false;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to setup user's subscription token
 *
 * @param  {String}           uid, user's id
 * @param  {String}           token, token strinig
 */
exports.setSubscriptionAsync = function(uid, token) {
    return UserTemp.addTokenAsync(uid, token)
        .then(function() {
            return UserTemp.ttlTokenAsync(uid);
        }).catch(function(err) {
            SharedUtils.printError('UserService', 'setSubscription', err);
            return false;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to remove user's subscription token
 *
 * @param  {String}           uid, user's id
 * @param  {String}           token, token strinig
 */
exports.remSubscriptionAsync = function(uid, token) {
    return Promise.props({
        isDeleted: UserTemp.delTokenAsync(uid, token),
        hasReset: UserTemp.ttlTokenAsync(uid)
    }).then(function(result) {
        return (result.isDeleted === 1);
    }).catch(function(err) {
        SharedUtils.printError('UserService', 'remSubscription', err);
        return false;
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to check user subscription is valid or not
 *
 * @param  {String}           uid, user's id
 * @param  {String}           token, token strinig
 */
exports.isSubscribedAsync = function(uid, token) {
    return Promise.props({
        isValid: UserTemp.isTokenExistAsync(uid, token),
        hasReset: UserTemp.ttlTokenAsync(uid)
    }).then(function(result) {
        return (result.isValid === 1);
    }).catch(function(err) {
        SharedUtils.printError('UserService', 'isSubscribedAsync', err);
        return false;
    });
};
