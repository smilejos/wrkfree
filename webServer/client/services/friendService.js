'use strict';
var SocketManager = require('./socketManager');
var SharedUtils = require('../../../sharedUtils/utils');

/**
 * Public API
 * @Author: George_Chen
 * @Description: for getting specific user's friend list
 *
 * @param {String}          uid, user's id
 */
exports.getFriendListAsync = function(uid) {
    return SharedUtils.argsCheckAsync(uid, 'md5')
        .then(function(targetUser) {
            var packet = {
                service: 'friend',
                api: 'getFriendsAsync',
                params: {
                    candidate: targetUser
                }
            };
            return SocketManager.requestAsync(packet);
        }).catch(function(err) {
            SharedUtils.printError('friendService.js', 'getFriendListAsync', err);
            return null;
        });
};
