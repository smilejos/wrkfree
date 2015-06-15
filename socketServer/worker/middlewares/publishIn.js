'use strict';
var Dispatcher = require('../dispatcher');
var SharedUtils = require('../../../sharedUtils/utils');

/*
 * @Description: All publish middlewares has these arguments
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
 * @Description: ensure user has already got auth token
 */
exports.ensureLogin = function(socket, channel, data, next) {
    var uid = socket.getAuthToken();
    if (SharedUtils.isMd5Hex(uid)) {
        return next();
    }
    next('authorization fail');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: ensure the subscription has already subscribed.
 */
exports.ensureSubscribed = function(socket, channel, data, next) {
    if (socket.isSubscribed(channel)) {
        return next();
    }
    return next('not allowed to publish request');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: preprocessing the publish request before pass to worker
 */
exports.preprocessing = function(socket, channel, data, next) {
    return Dispatcher(socket, data)
        .then(function(result) {
            return (result.error ? next(result.error.toString()) : next());
        }).catch(function(err) {
            SharedUtils.printError('publish.js', 'preprocessing', err);
            return next('not supported request or server error');
        });
};
