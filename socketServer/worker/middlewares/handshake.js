'use strict';
var Cookie = require('cookie');
var SharedUtils = require('../../../sharedUtils/utils');
var StorageManager = require('../../../storageService/storageManager');

/*
 * @Description: All handshake middlewares has two arguments
 *
 * @param {Object}        req, http req for building socket
 * @param {Function}      next, for calling next middleware
 */

/************************************************
 *
 *           Public APIs
 *
 ************************************************/

/**
 * Public API
 * @Author: George_Chen
 * @Description: check req cookie about web login state of current user
 * NOTE: only web login user is allowed to create socket
 *
 * @param {Object}        req, http req for building socket
 * @param {Function}      this.state.user.avatar, login user's avatar
 */
exports.ensureWebLogin = function(req, next) {
    var cookie = Cookie.parse(req.headers.cookie);
    var sessKey = _getSessionStoreKey(cookie.sid);
    var UserStorage = StorageManager.getService('User');

    return UserStorage.isUserSessionAuthAsync(cookie.uid, sessKey)
        .then(function(isAuth) {
            return (isAuth ? next() : next('Authentication failure'));
        }).catch(function(err) {
            SharedUtils.printError('handshake.js', 'ensureWebLogin', err);
            next('server error');
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: extract the seession store key from rawSid
 *
 * @param {String}        rawSid, the raw sid string 
 */
function _getSessionStoreKey(rawSid) {
    var value = rawSid.split(':')[1];
    return value.split('.')[0];
}
