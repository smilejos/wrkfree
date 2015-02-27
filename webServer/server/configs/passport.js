'use strict';
/************************************************
 *
 *          passport configuration
 *
 ************************************************/
var Passport = require('passport');
var Facebook = require('./passport/facebook');

module.exports = function () {
    var error = null;
    // into current login session.
    Passport.serializeUser(function (user, done) {
        var userInfo = {
            id: user.id,
            name: user.name,
            gender: user.gender,
            email: (user.emails ? user.emails[0].value : false) || user.email || user._json.email || '',
            locale: (user._json ? user._json.locale : false) || ''
        };
        // store the userInfo to session
        done(error, userInfo);
    });

    Passport.deserializeUser(function (obj, done) {
        done(error, obj);
    });

    // use these strategies
    Passport.use(Facebook);
};