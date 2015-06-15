'use strict';
var SocketManager = require('./socketManager');
var SocketUtils = require('./socketUtils');
var SharedUtils = require('../../../sharedUtils/utils');

/**
 * Public API
 * @Author: George_Chen
 * @Description: for getting specific user's friend list
 *
 * @param {String}          uid, user's id
 */
exports.getFriendListAsync = function(uid) {
    var packet = _setPacket('getFriendsAsync', null, {
        candidate: uid
    });
    return _request(packet, 'getFriendListAsync');
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
            SharedUtils.printError('friendService.js', caller, err);
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
    return SocketUtils.setPacket('friend', serverApi, clientApi, data);
}
