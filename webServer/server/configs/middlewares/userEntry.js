'use strict';
var SharedUtils = require('../../../../sharedUtils/utils');
var Promise = require('bluebird');
var Passport = require('passport');

/**
 * the user storage service, will be inited by the module.exports
 */
var UserStorage = null;

var LogUtils = require('../../../../sharedUtils/logUtils');
var LogCategory = 'WEB';

/************************************************
 *
 *           Public APIs
 *
 ************************************************/

var UserEntry = {};

/**
 * Public API
 * @Author: George_Chen
 * @Description: middleware for handling oauth login
 *     NOTE: triggered when user try oauth login each time
 */
UserEntry.oAuthLogin = function(req, res, next) {
    LogUtils.info(LogCategory, {
        provider: req.provider
    }, 'user ready to authenticate');
    return Passport.authenticate(req.provider, function(err, user) {
        if (err) {
            LogUtils.warn(LogCategory, {
                error: err
            }, 'passport authenticate error');
            return res.end();
        }
        if (!user) {
            LogUtils.warn(LogCategory, {
                provider: req.provider
            }, 'no user info got');
            return res.end();
        }
        return UserStorage.oAuthLoginAsync(user.id, req.provider)
            .then(function(info) {
                if (!info) {
                    user.provider = req.provider;
                    req.session.passport.user = user;
                    return res.redirect('/app/signup');
                }
                req.logIn(info, function(err) {
                    if (err) {
                        LogUtils.warn(LogCategory, {
                            error: err
                        }, 'passport serializeUser fail');
                        return res.redirect('/app/logout');
                    }
                    res.cookie('uid', info.uid);
                    return res.redirect('/app/dashboard');
                });
            });
    })(req, res, next);
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: middleware for handling new user registeration
 */
UserEntry.create = function(req, res, next) {
    LogUtils.info(LogCategory, null, 'ready to create new user');
    return Promise.try(function() {
        if (!UserStorage) {
            throw new Error('UserStorage is not initialized');
        }
        var signUpInfo = req.body;
        var provider = req.session.passport.user.provider;
        signUpInfo.locale = req.session.passport.user.locale;
        signUpInfo.avatar = req.session.passport.user.avatar;
        signUpInfo[provider] = req.session.passport.user.id;
        return UserStorage.addUserAsync(signUpInfo);
    }).then(function(result) {
        if (SharedUtils.isError(result)) {
            LogUtils.warn(LogCategory, {
                error: result
            }, 'create new user fail');
            req.error = result.toString();
        } else {
            // notify our slack channel that we have new user register
            LogUtils.info('SLACK', null, 'user: ' + result.nickName + ' [' + result.uid + '] just registered ');
            req.user = result;
            // override current session content
            req.session.passport.user = {
                uid: result.uid
            };
            res.cookie('uid', result.uid);
            // next route should be '/app/signup/done' to send basic notification
            req.nextRoute = '/app/dashboard';
        }
        return next();
    }).catch(function(err) {
        LogUtils.warn(LogCategory, {
            error: err
        }, 'unexpected error when create user');
        req.error = new Error('Unexpected error').toString();
        return next();
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: middleware for handling uid availability check
 * NOTE: used on user signup
 */
UserEntry.isEmailAvailable = function(req, res, next) {
    LogUtils.info(LogCategory, {
        method: req.method
    }, 'check email availability');
    return Promise.try(function() {
        if (!UserStorage) {
            throw new Error('UserStorage is not initialized');
        }
        return UserStorage.isEmailUsedAsync(req.query.email);
    }).then(function(result) {
        // user exist means not available
        req.uidAvailable = !result;
        return next();
    }).catch(function(err) {
        LogUtils.error(LogCategory, {
            email: req.query.email,
            method: req.method,
            error: err
        }, 'check email availability fail');
        req.error = new Error('Unexpected error').toString();
        req.nextRoute = '/';
        return next();
    });
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: ensure non-login user can access signup page
 */
UserEntry.authToSignup = function(req, res, next) {
    if (!!req.user.uid) {
        return res.redirect('/app/dashboard');
    }
    next();
};

module.exports = function(storageManager) {
    UserStorage = storageManager.getService('User');
    return UserEntry;
};
