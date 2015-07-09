'use strict';
var SharedUtils = require('../../../../sharedUtils/utils');
var ActionUtils = require('../actionUtils');
var FriendService = require('../../services/friendService');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: for user to track activities of his friends
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Array}       data.friendUid, an array of friend uids
 */
module.exports = function(actionContext, data) {
    return SharedUtils.argsCheckAsync(data.friendUid, 'md5')
        .then(function(uid) {
            return FriendService.subscribeActivityAsync(uid)
                .then(function(result) {
                    if (!result) {
                        _failRetryHandler(actionContext, uid);
                    }
                    return result;
                });
        }).catch(function(err) {
            SharedUtils.printError('trackFriendActivity.js', 'core', err);
            ActionUtils.showErrorEvent('friends', 'track friend activity fail');
        });
};

/**
 * @Author: George_Chen
 * @Description: to do a re-subscribe on fail subscribed friends
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      targetFriends, fail subscribed friends 
 */
function _failRetryHandler(actionContext, failFriendUid) {
    ActionUtils.showWarningEvent(
        'Friend',
        'subscribe friend activities fail',
        'retry',
        function(uid) {
            var action = require('./trackFriendActivity');
            actionContext.executeAction(action, {
                friendUid: uid
            });
        }.bind(null, failFriendUid));
}
