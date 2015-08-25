'use strict';
var SocketManager = require('./socketManager');
var SocketUtils = require('./socketUtils');
var SharedUtils = require('../../../sharedUtils/utils');
var OnChannelAdded = require('../actions/channel/onChannelAdded');

/**
 * Public API
 * @Author: George_Chen
 * @Description: for handling new channel added event
 *         NOTE: server sent this event when channel host permit client's channel request
 *
 * @param {Object}        data, the data is channel info document stored in db
 */
exports.onChannelAdded = function(data) {
    SocketUtils.execAction(OnChannelAdded, data, 'onChannelAdded');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: used to create channel
 *
 * @param {String}        data.name, the channel name
 */
exports.createAsync = function(data) {
    var packet = _setPacket('createAsync', null, data);
    return _request(packet, 'createAsync');
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
            var channel = SocketUtils.setChannelReq(validChannelId);
            return SocketManager.subscribeAsync(channel);
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
            var channel = SocketUtils.setChannelReq(validChannelId);
            return SocketManager.unSubscribeAsync(channel);
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
    var packet = _setPacket('getAuthChannelsAsync', null, null);
    return _request(packet, 'findByAuthorizedAsync');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: get channel infomation from server
 *
 * @param {String}        data.channelId, channel's id
 */
exports.getInfoAsync = function(data) {
    var packet = _setPacket('getInfoAsync', null, data);
    return _request(packet, 'getInfoAsync');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: get current channel memberList from server
 *
 * @param {String}        data.channelId, channel's id
 */
exports.getMemberListAsync = function(data) {
    var packet = _setPacket('getMemberListAsync', null, data);
    return _request(packet, 'getMemberListAsync');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: to get channel visitors
 *
 * @param {String}          data.channelId, channel id
 */
exports.getVisitorysAsync = function(data) {
    var packet = _setPacket('getVisitorysAsync', null, data);
    return _request(packet, 'getVisitorysAsync');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for user to get his member status on current channel
 *
 * @param {String}        data.channelId, channel's id
 */
exports.getMemberStatusAsync = function(data) {
    var packet = _setPacket('getMemberStatusAsync', null, data);
    return _request(packet, 'getMemberStatusAsync');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: used to subscribe channel notifications
 *
 * @param {String}        data.channelId, the channel id
 */
exports.subscribeNotificationAsync = function(channelId) {
    var subscribeReq = 'notification:' + channelId;
    return SocketManager.subscribeAsync(subscribeReq)
        .catch(function(err) {
            SharedUtils.printError('channelService.js', 'subscribeNotificationAsync', err);
            return null;
        });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for client to star or unstar channel
 *
 * @param {String}        data.channelId, the channel id
 * @param {Boolean}       data.toStar, indicate to star channel or not
 */
exports.starContrlAsync = function(data) {
    var packet = _setPacket('starContrlAsync', null, data);
    return _request(packet, 'starContrlAsync');
};

/************************************************
 *
 *           internal functions
 *
 ************************************************/

/**
 * @Author: George_Chen
 * @Description: a sugar sytanx function for handling socekt request
 *              events on drawService
 *         NOTE: caller is just for print error log; if error happen,
 *              we can know the root cause from which caller
 *       
 * @param {Object}          packet, the packet for request
 * @param {String}          caller, the caller function name
 */
function _request(packet, caller) {
    return SocketManager.requestAsync(packet)
        .catch(function(err) {
            SharedUtils.printError('channelService.js', caller, err);
            return null;
        });
}

/**
 * @Author: George_Chen
 * @Description: a sugar sytanx function for wrap the socket formated
 *               packet
 *
 * @param {String}          serverApi, the server handler api
 * @param {String}          clientApi, the client receiver api
 * @param {Object}          data, the request parameters
 */
function _setPacket(serverApi, clientApi, data) {
    return SocketUtils.setPacket('channel', serverApi, clientApi, data);
}
