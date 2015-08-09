'use strict';
var SocketManager = require('./socketManager');
var SocketUtils = require('./socketUtils');
var SharedUtils = require('../../../sharedUtils/utils');

/**
 * Public API
 * @Author: George_Chen
 * @Description: used to search on all the things
 *         NOTE: currently search on users and channels
 *       
 * @param {Object}          data.query, the query string
 */
exports.searchAsync = function(data) {
    var packet = _setPacket('searchAsync', null, data);
    return _request(packet, 'searchAsync');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: used to search on specific users
 *       
 * @param {Object}          data.query, the query string
 */
exports.searchUserAsync = function(data) {
    var packet = _setPacket('searchUserAsync', null, data);
    return _request(packet, 'searchUserAsync');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: used to search on specific channel
 *       
 * @param {Object}          data.query, the query string
 */
exports.searchChannelAsync = function(data) {
    var packet = _setPacket('searchChannelAsync', null, data);
    return _request(packet, 'searchChannelAsync');
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
            SharedUtils.printError('searchService.js', caller, err);
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
    return SocketUtils.setPacket('search', serverApi, clientApi, data);
}
