'use strict';
var SocketManager = require('./socketManager');
var SharedUtils = require('../../../sharedUtils/utils');

/**
 * Public API
 * @Author: George_Chen
 * @Description: used to create channel
 *
 * @param {String}        data.name, the partial channel name
 */
exports.createAsync = function(data) {
    var packet = {
        service: 'channel',
        api: 'createAsync',
        params: data
    };
    return SocketManager.requestAsync(packet)
        .catch(function(err) {
            SharedUtils.printError('channelService.js', 'createAsync', err);
            return null;
        });
};

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
 * Public API
 * @Author: George_Chen
 * @Description: get channel infomation from server
 *
 * @param {String}        data.channelId, channel's id
 */
exports.getInfoAsync = function(data) {
    var packet = {
        service: 'channel',
        api: 'getInfoAsync',
        params: data
    };
    return SocketManager.requestAsync(packet)
        .catch(function(err) {
            SharedUtils.printError('channelService.js', 'getInfoAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: get current channel memberList from server
 *
 * @param {String}        data.channelId, channel's id
 */
exports.getMemberListAsync = function(data) {
    var packet = {
        service: 'channel',
        api: 'getMemberListAsync',
        params: data
    };
    return SocketManager.requestAsync(packet)
        .catch(function(err) {
            SharedUtils.printError('channelService.js', 'getMemberListAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to get his member status on current channel
 *
 * @param {String}        data.channelId, channel's id
 */
exports.getMemberStatusAsync = function(data) {
    var packet = {
        service: 'channel',
        api: 'getMemberStatusAsync',
        params: data
    };
    return SocketManager.requestAsync(packet)
        .catch(function(err) {
            SharedUtils.printError('channelService.js', 'getMemberStatusAsync', err);
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
