'use strict';
/************************************************
 *
 *          passport configuration
 *
 ************************************************/
var Passport = require('passport');
var Facebook = require('./passport/facebook');
var Google = require('./passport/google');

module.exports = function () {
    var error = null;
    // into current login session.
    Passport.serializeUser(function (userInfo, done) {
        // store the userInfo to session
        // TODO: should we keep only user id or some small data ?
        done(error, userInfo);
    });

    Passport.deserializeUser(function (obj, done) {
        done(error, obj);
    });

    // use these strategies
    Passport.use(Facebook);
    Passport.use(Google);
};