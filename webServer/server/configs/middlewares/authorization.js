'use strict';
var StorageManager = require('../../../../storageService/storageManager');
var SharedUtils = require('../../../../sharedUtils/utils');
var LogUtils = require('../../../../sharedUtils/logUtils');
var LogCategory = 'WEB';
var ChannelStorage = StorageManager.getService('Channel');

/**
 * Public API
 * @Author: George_Chen
 * @Description: ensure user is logged in.
 */
exports.ensureAuthed = function(req, res, next) {
    if (!req.user || !req.user.uid) {
        LogUtils.warn(LogCategory, {
            ip: req.ip,
            method: req.method,
            url: req.url
        }, 'anonymous user request');
    }
    return (req.isAuthenticated() ? next() : _noAuthHandler(res));
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: directly redirect login user to dashboard when user has authenticated
 */
exports.redirectLoginUser = function(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/app/dashboard');
    }
    next();
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: ensure only member can enter channel
 */
exports.ensureMember = function(req, res, next) {
    var uid = req.user.uid;
    var cid = req.params.channelId;
    if (!SharedUtils.isMd5Hex(cid)) {
        return _unAuthedChannelReq(req, res);
    }
    return ChannelStorage.getAuthAsync(uid, cid)
        .then(function(isMember) {
            return (isMember ? next() : _unAuthedChannelReq(req, res));
        }).catch(function(err) {
            SharedUtils.printError('authorization.js', 'ensureMember', err);
            _unAuthedChannelReq(req, res);
        });
};

/**
 * @Author: George_Chen
 * @Description: for handling unauthorized channel request
 */
function _unAuthedChannelReq(req, res) {
    LogUtils.warn(LogCategory, {
        uid: req.user.uid,
        url: req.url,
        method: req.method
    }, 'unauthorized channel request');
    return _noAuthHandler(res);
}

/**
 * @Author: George_Chen
 * @Description: for handling route request without authorization
 */
function _noAuthHandler(res) {
    return res.redirect('/');
}
