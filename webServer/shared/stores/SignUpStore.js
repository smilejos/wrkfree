'use strict';
var createStore = require('fluxible/utils/createStore');

var PreFilledInfo = null;

var SignUpStore = createStore({
    storeName: 'SignUpStore',
    handlers: {
        'CHANGE_ROUTE': 'handleNavigate'
    },

    handleNavigate: function(route) {
        if (route.path === '/app/signup' && !PreFilledInfo) {
            var signUpInfo = route.resource.signUpInfo;
            PreFilledInfo = {
                email: signUpInfo.email || '',
                familyName: signUpInfo.familyName || '',
                givenName: signUpInfo.givenName || '',
                gender: signUpInfo.gender || 'male',
                originInfo: signUpInfo
            };
        }
        this.emitChange();
    },
    getState: function() {
        return PreFilledInfo;
    },
    dehydrate: function() {
        return PreFilledInfo;
    },
    rehydrate: function(info) {
        PreFilledInfo = info;
    }
});

module.exports = SignUpStore;
