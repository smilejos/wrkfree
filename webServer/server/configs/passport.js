'use strict';
/************************************************
 *
 *          passport configuration
 *
 ************************************************/
var Passport = require('passport');
var Facebook = require('./passport/facebook');
var Google = require('./passport/google');
var SharedUtils = require('../../../sharedUtils/utils');

module.exports = function(StorageManager) {
    var error = null;
    var UserStorage = StorageManager.getService('User');

    /**
     * @Author: George_Chen
     * @Description: Passport serialize function, 
     *     NOTE: we only serialize uid into session object
     * 
     * @param {Object}      userInfo, user info pass by req.logIn()
     * @param {Function}    done, callback function filled by passport.js
     */
    Passport.serializeUser(function(userInfo, done) {
        return done(error, {
            uid: userInfo._id
        });
    });

    /**
     * @Author: George_Chen
     * @Description: Passport deSerialize function, 
     *     NOTE: based on info(uid) we serialize to session object, use it to 
     *         query full info of current user on each http request.
     * 
     * @param {Object}      user, user info stored in session object
     * @param {Function}    done, callback function filled by passport.js
     */
    Passport.deserializeUser(function(user, done) {
        // if user doesn't have uid, then we should not try to get info from db
        if (!SharedUtils.isString(user.uid)) {
            return done(error, user);
        }
        return UserStorage.getUserAsync(user.uid)
            .then(function(info) {
                info.uid = user.uid;
                return info;
            }).catch(function(err) {
                SharedUtils.printError('passport.js', 'deserializeUser', err);
                return {};
            }).nodeify(done);
    });

    // use these strategies
    Passport.use(Facebook);
    Passport.use(Google);
};
