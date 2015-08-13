'use strict';
var Promise = require('bluebird');
var Cookie = require('cookie');
var middlewareUtils = require('./utils');
var SharedUtils = require('../../../sharedUtils/utils');
var LogUtils = require('../../../sharedUtils/logUtils');
var LogCategory = 'SOCKET';

/*
 * @Description: All handshake middlewares has two arguments
 *
 * @param {Object}        req, http req for building socket
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
 * @Description: check req cookie about web login state of current user
 * NOTE: only web login user is allowed to create socket
 * 
 */
exports.ensureWebLogin = function(req, next) {
    return Promise.try(function() {
        var cookie = Cookie.parse(req.headers.cookie);
        return middlewareUtils.isCookieSessionAuthAsync(cookie);
    }).then(function(isAuth) {
        if (isAuth) {
            return next();
        }
        LogUtils.warn(LogCategory, {
            cookie: req.headers.cookie
        }, 'handshake authentication failure');
        next('reject socket handshake');
    }).catch(function(err) {
        LogUtils.error(LogCategory, {
            cookie: req.headers.cookie,
            error: err.toString()
        }, 'unexpected error during handshake');
        next('reject socket handshake');
    });
};
