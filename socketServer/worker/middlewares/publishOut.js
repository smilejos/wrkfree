'use strict';
/*
 * @Description: All publish-out middlewares has these arguments
 *
 * @param {Object}        socket, the server socket object
 * @param {String}        channel, the subscribed channel
 * @param {Object}        data, the json data object
 * @param {Function}      next, for calling next middleware
 */

/************************************************
 *
 *           Public APIs
 *
 ************************************************/

/**
 * Public API
 * @Author: George_Chen
 * @Description: ensure the sender socket will not receive data 
 *               that he has published
 */
exports.filterSelf = function(socket, channel, data, next) {
    var shouldFilter = true;
    if (socket.id === data.socketId) {
        return next(shouldFilter);
    }
    next();
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: ensure all uids in the filterList will be filtered out
 *         NOTE: filterList is a json object like below:
 *         {
 *             'uid1': true,
 *             'uid2': true,
 *             'uid3': false
 *         }
 *         "uid1" and "uid2" will be filtered out in this case
 */
exports.filterByUids = function(socket, channel, data, next) {
    var uid = socket.getAuthToken();
    var shouldFilter = true;
    if (data.filterList instanceof Object) {
        return (data.filterList[uid] ? next(shouldFilter) : next());
    }
    return next();
};
