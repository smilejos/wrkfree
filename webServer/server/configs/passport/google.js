'use strict';
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var Env = process.env.NODE_ENV || 'development';
// API held by George_Chen
var Config = {
    development: {
        clientID: '816501801074-nfat8c3rodkbtl2jfo17n7h3h9g63kgb.apps.googleusercontent.com',
        clientSecret: 'zxsAQabqyO7CARprXUsbxNgf',
        callbackURL: 'https://localhost/auth/google/callback'
    },
    production: {
        clientID: '816501801074-ddh10h5ko1m9im0lr3hbq7hv75t53o6h.apps.googleusercontent.com',
        clientSecret: 'wv5jFJXajR-zenLKcOKgIeBo',
        callbackURL: 'https://wrkfree.com/auth/google/callback'
    }
};

/************************************************
 *
 *          facebook oauth strategy
 *
 ************************************************/

module.exports = new GoogleStrategy({
    clientID: Config[Env].clientID,
    clientSecret: Config[Env].clientSecret,
    callbackURL: Config[Env].callbackURL
}, function(accessToken, refreshToken, profile, done) {
    var userInfo = {
        provider: profile.provider,
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
