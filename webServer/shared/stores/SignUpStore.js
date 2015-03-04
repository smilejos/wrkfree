'use strict';
var createStore = require('fluxible/utils/createStore');

var PreFilledInfo = null;

var SignUpStore = createStore({
    storeName: 'SignUpStore',
    handlers: {
        'CHANGE_ROUTE': 'handleNavigate'
    },
    initialize: function() {
        PreFilledInfo = {};
    },
    handleNavigate: function(route) {
        if (route.path === '/app/signup') {
            var signUpInfo = route.resource.signUpInfo;
            PreFilledInfo = {
                email: signUpInfo.email || '',
                lastName: signUpInfo.name.familyName || '',
                firstName: signUpInfo.name.givenName || '',
                gender: signUpInfo.gender || 'male',
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
