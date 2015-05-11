'use strict';
var StorageManager = require('../../../../storageService/storageManager');
var SharedUtils = require('../../../../sharedUtils/utils');
var ChannelStorage = StorageManager.getService('Channel');

/**
 * Public API
 * @Author: George_Chen
 * @Description: ensure user is logged in.
 */
exports.ensureAuthed = function(req, res, next) {
    return (req.isAuthenticated() ? next() : _noAuthHandler(res));
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
        return _noAuthHandler(res);
    }
    return ChannelStorage.getAuthAsync(uid, cid)
        .then(function(isMember) {
            return (isMember ? next() : _noAuthHandler(res));
        }).catch(function(err) {
            SharedUtils.printError('authorization.js', 'ensureMember', err);
            _noAuthHandler(res);
        });
};

/**
 * @Author: George_Chen
 * @Description: for handling route request without authorization
 */
function _noAuthHandler(res) {
    return res.redirect('/');
}
