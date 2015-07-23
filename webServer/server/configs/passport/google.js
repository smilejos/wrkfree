'use strict';
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var OAuthConfigs = require('./params').getOAuth('google');

/************************************************
 *
 *          facebook oauth strategy
 *
 ************************************************/

module.exports = new GoogleStrategy({
    clientID: OAuthConfigs.clientID,
    clientSecret: OAuthConfigs.clientSecret,
    callbackURL: OAuthConfigs.callbackURL
}, function(accessToken, refreshToken, profile, done) {
    LogUtils.info(LogCategory, null, 'oauth login receive info from google');
    if (!profile) {
        LogUtils.warn(LogCategory, null, 'user profile missing');
        return done(new Error('fail to auth on google'));
    }
    var userInfo = {
        id: profile.id,
        familyName: profile.name.familyName,
        givenName: profile.name.givenName,
        gender: profile.gender,
        avatar: profile.photos[0].value || '',
        email: (profile.emails ? profile.emails[0].value : false) || '',
        locale: (profile._json.language === 'en' ? 'en_US' : profile._json.language)
    };
    done(null, userInfo);
});
