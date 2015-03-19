'use strict';
var Env = process.env.NODE_ENV || 'development';
var OAuthConfigs = {};

var Params = {
    google: {
        scope: [
            'https://www.googleapis.com/auth/plus.login',
            'https://www.googleapis.com/auth/userinfo.email'
        ]
    },
    facebook: {
        scope: [
            'email'
        ]
    }
};

/**
 * Google oauth configs
 * NOTE: all applied by George,
 */
OAuthConfigs.google = {
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

/**
 * Facebook oauth configs
 * NOTE: development applied by seasonny,
 *       production  applied by jos
 */
OAuthConfigs.facebook = {
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

/**
 * Public API
 * @Author: George_Chen
 * @Description: for getting provider dependent params
 *
 * @param {String}      provider, provider name
 */
exports.getParams = function(provider) {
    return (Params[provider] ? Params[provider] : null);
};

/**
 * Public API
 * @Author: George_Chen
 * @Description: for getting provider dependent oauth configs
 *
 * @param {String}      provider, provider name
 */
exports.getOAuth = function(provider) {
    return (OAuthConfigs[provider] ? OAuthConfigs[provider][Env] : null);
};
