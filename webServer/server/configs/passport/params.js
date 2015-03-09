'use strict';

var Params = {
    google: {
        scope: [
            'https://www.googleapis.com/auth/plus.login',
            'https://www.googleapis.com/auth/userinfo.email'
        ]
    },
    facebook: {
        // TODO:
    }
};

exports.get = function(provider) {
    return (Params[provider] ? Params[provider] : null);
};