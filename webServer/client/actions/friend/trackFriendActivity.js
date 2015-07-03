'use strict';
var SharedUtils = require('../../../../sharedUtils/utils');
var ActionUtils = require('../actionUtils');
var Promise = require('bluebird');
var FriendService = require('../../services/friendService');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: for user to track activities of his friends
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Array}       data.friendUids, an array of friend uids
 */
module.exports = function(actionContext, data) {
    var failSubscriptions = [];
    return Promise.map(data.friendUids, function(uid) {
        return SharedUtils.argsCheckAsync(uid, 'md5');
    }).map(function(uid) {
        return FriendService.subscribeActivityAsync(uid)
            .then(function(result) {
                if (!result) {
                    failSubscriptions.push(uid);
                }
                return true;
            });
    }).then(function() {
        if (failSubscriptions.length > 0) {
            _failRetryHandler(actionContext, failSubscriptions);
        }
    }).catch(function(err) {
        SharedUtils.printError('trackFriendActivity.js', 'core', err);
        ActionUtils.showErrorEvent('friends', 'track friends activity fail');
    });
};

/**
 * @Author: George_Chen
 * @Description: to do a re-subscribe on fail subscribed friends
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      targetFriends, fail subscribed friends 
 */
function _failRetryHandler(actionContext, targetFriends) {
    ActionUtils.showWarningEvent(
        'friends',
        'subscribe friend activities fail',
        'retry',
        function(failFriends) {
            var action = require('./trackFriendActivity');
            actionContext.executeAction(action, {
                friendUids: failFriends
            });
        }.bind(null, targetFriends));
}
