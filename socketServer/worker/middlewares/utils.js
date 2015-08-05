'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');
var StorageManager = require('../../../storageService/storageManager');
var UserStorage = StorageManager.getService('User');

/**
 * Public API
 * @Author: George_Chen
 * @Description: check user cookie is valid or not
 *
 * @param {Object}        cookie, the cookie json object
 */
exports.isCookieSessionAuthAsync = function(cookie) {
    return Promise.try(function() {
        var uid = cookie.uid;
        var sessKey = _getSessionStoreKey(cookie.sid);
        return UserStorage.isUserSessionAuthAsync(uid, sessKey);
    }).then(function(isAuth) {
        var errMsg = 'fail to check session authorization on storage service';
        return SharedUtils.checkExecuteResult(isAuth, errMsg);
    }).catch(function(err) {
        SharedUtils.printError('middleware-utils.js', 'isCookieSessionAuthAsync', err);
        throw new Error('storage internal error');
    });
};


/**
 * @Author: George_Chen
 * @Description: extract the seession store key from rawSid
 *
 * @param {String}        rawSid, the raw sid string 
 */
function _getSessionStoreKey(rawSid) {
    var value = rawSid.split(':')[1];
    return value.split('.')[0];
}
