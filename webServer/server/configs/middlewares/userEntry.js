'use strict';
var SharedUtils = require('../../../../sharedUtils/utils');
var Promise = require('bluebird');

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
 * @Description: middleware for handling the successful oauth login
 */
UserEntry.enter = function(req, res, next) {
    if (!UserStorage) {
        return next();
    }
    var userInfo = req.session.passport.user;
    return UserStorage.oAuthLoginAsync(userInfo.id, userInfo.provider)
        .then(function(basicInfo) {
            // pass to signup or user's dashboard
            req.nextRoute = (!basicInfo ? '/app/signup' : '/app/dashboard');
            if (basicInfo) {
                userInfo.email = basicInfo.email;
                userInfo.name = basicInfo.nickName;
            }
            return next();
        }).catch(function(err) {
            SharedUtils.printError('UserEntry', 'enter', err);
            res.redirect('/error');
        });
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
UserEntry.isUidAvailable = function(req, res, next) {
    return Promise.try(function() {
        if (!UserStorage) {
            throw new Error('UserStorage is not initialized');
        }
        return UserStorage.isUserExistAsync(req.query.email);
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
