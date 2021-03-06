'use strict';
var FacebookStrategy = require('passport-facebook').Strategy;
var OAuthConfigs = require('./params').getOAuth('facebook');
var LogUtils = require('../../../../sharedUtils/logUtils');
var LogCategory = 'WEB';

/************************************************
 *
 *          facebook oauth strategy
 *
 ************************************************/

module.exports = new FacebookStrategy({
    clientID: OAuthConfigs.clientID,
    clientSecret: OAuthConfigs.clientSecret,
    callbackURL: OAuthConfigs.callbackURL
}, function(accessToken, refreshToken, profile, done) {
    LogUtils.info(LogCategory, null, 'oauth login receive info from facebook');
    if (!profile) {
        LogUtils.warn(LogCategory, null, 'user profile missing');
        return done(new Error('fail to auth on facebook'));
    }
    var userInfo = {
        id: profile.id,
        familyName: profile.name.familyName,
        givenName: profile.name.givenName,
        gender: profile.gender,
        avatar: 'https://graph.facebook.com/' + profile.id + '/picture',
        email: (profile.emails ? profile.emails[0].value : false) || profile.email || profile._json.email || '',
        locale: (profile._json ? profile._json.locale : false) || ''
    };
    done(null, userInfo);
});
