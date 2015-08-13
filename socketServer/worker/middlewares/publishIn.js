'use strict';
var Dispatcher = require('../dispatcher');
var SharedUtils = require('../../../sharedUtils/utils');
var LogUtils = require('../../../sharedUtils/logUtils');
var LogCategory = 'SOCKET';

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
    LogUtils.warn(LogCategory, {
        reqData: data,
        pubsubChannel: channel
    }, '[' + socket.id + '] did not get token before publish request');
    next('reject publishIn request');
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
    LogUtils.warn(LogCategory, {
        reqData: data,
        pubsubChannel: channel,
        uid: socket.getAuthToken()
    }, '[' + socket.id + '] did not subscribe target channel before publish request');
    next('reject publishIn request');
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: preprocessing the publish request before pass to worker
 */
exports.preprocessing = function(socket, channel, data, next) {
    return Dispatcher(socket, data)
        .then(function(result) {
            if (!result.error) {
                return next();
            }
            LogUtils.warn(LogCategory, {
                reqData: data,
                pubsubChannel: channel,
                uid: socket.getAuthToken(),
                error: result.error.toString()
            }, '[' + socket.id + '] publishIn request fail on server');
            next('reject publishIn request');
        }).catch(function(err) {
            LogUtils.error(LogCategory, {
                reqData: data,
                pubsubChannel: channel,
                uid: socket.getAuthToken(),
                error: err.toString()
            }, '[' + socket.id + '] publishIn request is not supported or server error');
            next('reject publishIn request');
        });
};
