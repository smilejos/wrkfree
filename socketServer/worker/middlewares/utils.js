'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');
var StorageManager = require('../../../storageService/storageManager');


exports.isCookieSessionAuthAsync = function(cookie) {
    return Promise.try(function() {
        var uid = cookie.uid;
        var sessKey = _getSessionStoreKey(cookie.sid);
        var UserStorage = StorageManager.getService('User');
        return UserStorage.isUserSessionAuthAsync(uid, sessKey);
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
