'use strict';
var createStore = require('fluxible/utils/createStore');

var SignUpStore = createStore({
    storeName: 'SignUpStore',
    handlers: {
        'CHANGE_ROUTE': 'handleNavigate'
    },
    
    initialize: function() {
        // prefilled values for signup form
        this.preFilledInfo = null;

        // used to record the field status of signup form
        this.statusInfo = {
            email: false,
            familyName: false,
            givenName: false,
            gender: false,
        };
    },

    handleNavigate: function(route) {
        if (route.path === '/app/signup' && !this.preFilledInfo) {
            var signUpInfo = route.resource.signUpInfo;
            this.preFilledInfo = {
                email: signUpInfo.email || '',
                familyName: signUpInfo.familyName || '',
                givenName: signUpInfo.givenName || '',
                gender: signUpInfo.gender || 'male',
                originInfo: signUpInfo
            };
            this.Filled = true;
        }
        this.emitChange();
    },

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: used to runtime update the validated status of each field
     *
     * @param {String}      field, filed name of signup form
     * @param {String}      value, field value of signup form
     * @param {Boolean}     status, the valid status
     */
    updateStore: function(field, value, status) {
        if (this.preFilledInfo[field] === 'undefined') {
            return;
        }
        this.preFilledInfo[field] = value;
        this.statusInfo[field] = status;
        this.emitChange();
    },

    getState: function() {
        return {
            info: this.preFilledInfo,
            status: this.statusInfo
        };
    },
    dehydrate: function() {
        return this.preFilledInfo;
    },
    rehydrate: function(info) {
        this.preFilledInfo = info;
    }
});

module.exports = SignUpStore;
