'use strict';
var SharedUtils = require('../../../../sharedUtils/utils');
var ActionUtils = require('../actionUtils');
var Promise = require('bluebird');

/**
 * Public API
 * @Author: George_Chen
 * @Description: check and updating friend status changed on friendList
 *
 * @param {String}          data.uid, user's id
 * @param {Boolean}         data.isOnline, the online status of friend
 */
module.exports = function(actionContext, data) {
    return Promise.props({
        uid: SharedUtils.argsCheckAsync(data.uid, 'md5'),
        isOnline: SharedUtils.argsCheckAsync(data.isOnline, 'boolean')
    }).then(function(recvData) {
        actionContext.dispatch('UPDATE_FRIEND_STATUS', recvData);
    }).catch(function(err) {
        SharedUtils.printError('updateFriendStatus.js', 'core', err);
        ActionUtils.showErrorEvent('Friend', 'update friend online status');
    });
};
