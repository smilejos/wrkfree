'use strict';
var createStore = require('fluxible/utils/createStore');

var MainAppStore = createStore({
    storeName: 'MainAppStore',
    handlers: {
        'CHANGE_ROUTE': 'handleNavigate'
    },
    initialize: function () {
        this.currentRoute = null;
    },
    handleNavigate: function (route) {
        if (this.currentRoute && route.path === this.currentRoute.path) {
            return;
        }
        var self = this;
        this.dispatcher.waitFor(['SignUpStore'], function(){
            self.currentRoute = route;
            self.emitChange();
        });
    },
    getState: function () {
        return {
            route: this.currentRoute
        };
    },
    dehydrate: function () {
        return this.getState();
    },
    rehydrate: function (state) {
        this.currentRoute = state.route;
    }
});


module.exports = MainAppStore;