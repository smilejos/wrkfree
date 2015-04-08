'use strict';
var SharedUtils = require('../../../../sharedUtils/utils');
var Promise = require('bluebird');
var Passport = require('passport');

/**
 * the user storage service, will be inited by the module.exports
 */
var UserStorage = null;

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
    return Passport.authenticate(req.provider, function(err, user) {
        return UserStorage.oAuthLoginAsync(user.id, req.provider)
            .then(function(info) {
                if (!info) {
                    user.provider = req.provider;
                    req.session.passport.user = user;
                    return res.redirect('/app/signup');
                }
                req.logIn(info, function(err) {
                    if (err) {
                        SharedUtils.printError('userEntry.js', 'oauthLogin', err);
                        return res.redirect('/app/logout');
                    }
                    res.cookie('uid', info._id);
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
            req.error = result.toString();
        } else {
            // override current session content
            req.session.passport.user = {
                uid: result._id
            };
            res.cookie('uid', result._id);
            // next route should be '/app/signup/done' to send basic notification
            req.nextRoute = '/app/dashboard';
        }
        return next();
    }).catch(function(err) {
        SharedUtils.printError('UserEntry', 'create', err);
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
        SharedUtils.printError('UserEntry', 'isUidAvailable', err);
        req.error = new Error('Unexpected error').toString();
        req.nextRoute = '/';
        return next();
    });
};

module.exports = function(storageManager) {
    UserStorage = storageManager.getService('User');
    return UserEntry;
};
