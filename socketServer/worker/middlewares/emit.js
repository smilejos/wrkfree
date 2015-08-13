'use strict';
var SharedUtils = require('../../../sharedUtils/utils');
var LogUtils = require('../../../sharedUtils/logUtils');
var LogCategory = 'SOCKET';

/*
 * @Description: All subscribe middlewares has three arguments
 *
 * @param {Object}        socket, the server socket object
 * @param {String}        event, the user emit event
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
 * @Description: ensure user has already got token
 *
 * NOTE: only event 'auth' can pass without token check
 */
exports.ensureLogin = function(socket, event, data, next) {
    if (event === 'auth') {
        return next();
    }
    var token = socket.getAuthToken();
    if (SharedUtils.isMd5Hex(token)) {
        return next();
    }
    LogUtils.warn(LogCategory, {
        reqData: data
    }, '[' + socket.id + '] did not get token before emit request');
    next('reject socket emit request');
};
