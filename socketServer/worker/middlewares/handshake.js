'use strict';
var Promise = require('bluebird');
var Cookie = require('cookie');
var SharedUtils = require('../../../sharedUtils/utils');
var middlewareUtils = require('./utils');

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
 * @param {Object}        req, http req for building socket
 * @param {Function}      this.state.user.avatar, login user's avatar
 */
exports.ensureWebLogin = function(req, next) {
    return Promise.try(function() {
        var cookie = Cookie.parse(req.headers.cookie);
        return middlewareUtils.isCookieSessionAuthAsync(cookie);
    }).then(function(isAuth) {
        return (isAuth ? next() : next('handshake authentication failure'));
    }).catch(function(err) {
        SharedUtils.printError('handshake.js', 'ensureWebLogin', err);
        next('server error druing handshake');
    });
};
