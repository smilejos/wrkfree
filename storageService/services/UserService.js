'use strict';
var SharedUtils = require('../../sharedUtils/utils');
var Promise = require('bluebird');
var NotificationDao = require('../daos/NotificationDao');
var UserTemp = require('../tempStores/UserTemp');
var PgUser = require('../pgDaos/PgUser');
var PgChannel = require('../pgDaos/PgChannel');
var SearchService = require('./SearchService');

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
        return PgUser.isEmailUsedAsync(userInfo.email);
    }).then(function(exist) {
        if (exist) {
            throw new Error('user already exist');
        }
        return PgUser.createAsync(userInfo);
    }).then(function(result) {
        if (!result) {
            return result;
        }
        return SearchService.indexUserAsync(result)
            .then(function(){
                return result;
            });
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
    return PgUser.findByOAuthAsync(clientId, provider)
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
 * @Description: to check sepcific email has been used or not
 *
 * @param {String}      uid, user id
 */
exports.isEmailUsedAsync = function(uid) {
    return PgUser.isEmailUsedAsync(uid)
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
    return PgUser.setUnreadNoticeCountAsync(user, true)
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
    return PgUser.setLayoutAsync(user, isGrid)
        .catch(function(err) {
            SharedUtils.printError('UserService', 'setDashboardLayoutAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: update the default hidden state of tourguide
 *
 * @param {String}          user, the current user id
 * @param {Boolean}         data.isHidden, to indicate tour is default hidden or not
 */
exports.setDefaultTourAsync = function(user, isHidden) {
    return PgUser.setDefaultTourAsync(user, isHidden)
        .then(function() {
            return true;
        }).catch(function(err) {
            SharedUtils.printError('UserService', 'disableTourHelperAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: check the default hidden state of tourguide
 *
 * @param {String}          user, the current user id
 */
exports.isDefaultTourHiddenAsync = function(user) {
    return PgUser.isDefaultTourHiddenAsync(user)
        .catch(function(err) {
            SharedUtils.printError('UserService', 'isDefaultTourHiddenAsync', err);
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
            return PgUser.findInIdsAsync(user);
        }
        return PgUser.findByIdAsync(user, isLogin);
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

/**
 * Public API
 * @Author: George_Chen
 * @Description: check user already got auth or not based on web session
 *
 * @param  {String}           uid, user's id
 * @param  {String}           sid, user's web session id
 */
exports.getNotificationsAsync = function(uid) {
    return NotificationDao.findByTargetAsync(uid)
        .map(function(notificationInfo) {
            if (notificationInfo.type === 'channel') {
                return PgChannel.findByIdAsync(notificationInfo.extraInfo)
                    .then(function(info) {
                        notificationInfo.extraInfo = {
                            channelId: info.channelId,
                            name: info.name
                        };
                        return notificationInfo;
                    });
            }
            return notificationInfo;
        }).catch(function(err) {
            SharedUtils.printError('UserService', 'getNotificationsAsync', err);
            return null;
        });
};
