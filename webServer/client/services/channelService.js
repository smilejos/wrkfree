'use strict';
var SocketManager = require('./socketManager');
var SharedUtils = require('../../../sharedUtils/utils');

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to enter specific channel space
 *
 * @param {String}        channelId, channel's id
 */
exports.enterAsync = function(channelId) {
    return SharedUtils.argsCheckAsync(channelId, 'md5')
        .then(function(validChannelId) {
            var req = _subscribeReq(validChannelId);
            return SocketManager.subscribeAsync(req);
        }).catch(function(err) {
            SharedUtils.printError('channelService.js', 'enterAsync', err);
            return false;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to leave current channel space
 *
 * @param {String}        channelId, channel's id
 */
exports.leaveAsync = function(channelId) {
    return SharedUtils.argsCheckAsync(channelId, 'md5')
        .then(function(validChannelId) {
            var req = _subscribeReq(validChannelId);
            return SocketManager.unSubscribeAsync(req);
        }).catch(function(err) {
            SharedUtils.printError('channelService.js', 'leaveAsync', err);
            return false;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: find all authorized channels info
 */
exports.findByAuthorizedAsync = function() {
    var packet = {
        service: 'channel',
        api: 'getAuthChannelsAsync'
    };
    return SocketManager.requestAsync(packet)
        .catch(function(err) {
            SharedUtils.printError('channelService.js', 'findByAuthorizedAsyncc', err);
            return null;
        });
};

/**
 * @Author: George_Chen
 * @Description: to create the channel subscription request
 *
 * @param {String}        channelId, channel's id
 */
function _subscribeReq(channelId) {
    return 'channel:' + channelId;
}
