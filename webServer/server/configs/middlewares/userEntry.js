'use strict';
var SharedUtils = require('../../../../sharedUtils/utils');


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
    return UserStorage.oAuthLoginAsync(userInfo.id, 'facebook')
        .then(function(basicInfo) {
            // pass to signup or user's dashboard
            req.nextRoute = (!basicInfo ? '/app/signup' : '/app/dashboard');
            if (basicInfo) {
                userInfo.email = basicInfo.email;
                userInfo.name = basicInfo.nickName;
            }
            res.cookie('user', JSON.stringify(userInfo));
            return next();
        }).catch(function(err) {
            SharedUtils.printError('userEntry', 'login', err);
            res.redirect('/error');
        });
};

module.exports = function(storageManager) {
    UserStorage = storageManager.getService('User');
    return UserEntry;
};
