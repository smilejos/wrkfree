'use strict';
var SharedUtils = require('../../../../sharedUtils/utils');
var ActionUtils = require('../actionUtils');

/**
 * Public API
 * @Author: George_Chen
 * @Description: check and updating friend status changed on friendList
 *
 * @param {String}          data.uid, user's id
 */
module.exports = function(actionContext, data) {
    return SharedUtils.argsCheckAsync(data.uid, 'md5')
        .then(function(friendUid) {
            actionContext.dispatch('UPDATE_FRIEND_STATUS', {
                uid: friendUid,
                isOnline: true
            });
        }).catch(function(err) {
            SharedUtils.printError('updateFriendStatus.js', 'core', err);
            ActionUtils.showErrorEvent('Friend', 'update online friend fail');
        });
};
