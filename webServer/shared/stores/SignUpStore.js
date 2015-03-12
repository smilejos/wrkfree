'use strict';
var createStore = require('fluxible/utils/createStore');

/**
 * prefilled values for signup form
 */
var PreFilledInfo = null;

/**
 * used to record the field status of signup form
 */
var StatusInfo = {
    email: false,
    familyName: false,
    givenName: false
};

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

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: used to runtime update the validated status of each field
     *
     * @param {String}      field, filed name of signup form
     * @param {Boolean}     status, the valid status
     */
    updateValidStatus: function(field, status){
        if (StatusInfo[field] === 'undefined') {
            return;
        }
        StatusInfo[field] = status;
        this.emitChange();
    },
    getState: function() {
        return {
            info: PreFilledInfo,
            status: StatusInfo
        };
    },
    dehydrate: function() {
        return PreFilledInfo;
    },
    rehydrate: function(info) {
        PreFilledInfo = info;
    }
});

module.exports = SignUpStore;
