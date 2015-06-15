'use strict';
var CreateStore = require('fluxible/utils/createStore');
var Promise = require('bluebird');

module.exports = CreateStore({
    storeName: 'SignUpStore',

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

    /**
     * @Public API
     * @Author: George_Chen
     * @Description: polyfill friendList object to friend store
     *
     * @param {String}      friendList, an array of friends got from mongodb
     */
    polyfillAsync: function(userInfo) {
        var self = this;
        return Promise.try(function() {
            self.preFilledInfo = {
                email: userInfo.email || '',
                familyName: userInfo.familyName || '',
                givenName: userInfo.givenName || '',
                gender: userInfo.gender || 'male'
            };
        }).then(function() {
            // inform the fluxible that this store has changed
            self.emitChange();
        });
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
