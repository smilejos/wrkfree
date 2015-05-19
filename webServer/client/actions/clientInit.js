'use strict';
var Promise = require('bluebird');
var SharedUtils = require('../../../sharedUtils/utils');
var HeaderStore = require('../../shared/stores/HeaderStore');
var FriendStore = require('../../shared/stores/friendStore');
var SocketManager = require('../services/socketManager');
var UserService = require('../services/userService');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: for handling the client initial action
 * 
 * @param {Function}    data.done, callback function
 */
module.exports = function(actionContext, data) {
    var headerStore = actionContext.getStore(HeaderStore);
    var friendStore = actionContext.getStore(FriendStore);
    var friends = friendStore.getState().friends;
    var selfInfo = headerStore.getSelfInfo();
    var cacheUsers = [selfInfo].concat(friends);
    var selfChannel = 'user:' + selfInfo.uid;

    return Promise.join(
        // subscribe self channel
        SocketManager.subscribeAsync(selfChannel),
        // cache info of known users
        UserService.polyfillAsync(cacheUsers),
        function() {
            if (typeof data.done === 'function') {
                data.done();
            }
        }).catch(function(err) {
            SharedUtils.printError('clientini.js', 'core', err);
        });
};
