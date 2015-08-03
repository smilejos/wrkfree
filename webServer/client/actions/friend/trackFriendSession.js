'use strict';
var SharedUtils = require('../../../../sharedUtils/utils');
var ActionUtils = require('../actionUtils');

var Configs = require('../../../../configs/config');
var SESSION_ONLINE_TIMEOUT_IN_MSECOND = Configs.get().params.friend.sessionTimeoutInMsecond;
if (!SharedUtils.isNumber(SESSION_ONLINE_TIMEOUT_IN_MSECOND)) {
    throw new Error('friend params error');
}

var FriendSessions = {};

/**
 * @Public API
 * @Author: George_Chen
 * @Description: for tracking target friend session is still online or not
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.uid, the friend uid
 */
module.exports = function(actionContext, data) {
    return SharedUtils.argsCheckAsync(data.uid, 'md5')
        .then(function(uid) {
            if (FriendSessions[uid]) {
                clearTimeout(FriendSessions[uid]);
            }
            FriendSessions[uid] = setTimeout(function() {
                data.isOnline = false;
                actionContext.dispatch('UPDATE_FRIEND_STATUS', data);
            }, SESSION_ONLINE_TIMEOUT_IN_MSECOND);
        }).catch(function(err) {
            SharedUtils.printError('trackFriendSession.js', 'core', err);
            ActionUtils.showErrorEvent('friends', 'track friend session fail');
        });
};
