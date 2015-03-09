'use strict';
var FacebookStrategy = require('passport-facebook').Strategy;
var Env = process.env.NODE_ENV || 'development';
var Config = {
    //API held by seasonny
    development: {
        clientID: '1441276159473693',
        clientSecret: '6c73bdcc98a95f746e17a1d42cd3e84c',
        callbackURL: 'https://localhost/auth/facebook/callback'
    },
    //API held by Jos
    production: {
        clientID: '1375757972726013',
        clientSecret: '37f92642dd3a113d238205eff996eef9',
        callbackURL: 'https://wrkfree.com/auth/facebook/callback'
    }
};

/************************************************
 *
 *          facebook oauth strategy
 *
 ************************************************/

module.exports = new FacebookStrategy({
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
        avatar: 'https://graph.facebook.com/'+ profile.id +'/picture',
        email: (profile.emails ? profile.emails[0].value : false) || profile.email || profile._json.email || '',
        locale: (profile._json ? profile._json.locale : false) || ''
    };
    done(null, userInfo);
});
