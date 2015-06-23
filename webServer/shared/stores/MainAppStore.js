'use strict';
var CreateStore = require('fluxible/addons').createStore;

var MainAppStore = CreateStore({
    storeName: 'MainAppStore',
    handlers: {
        'CHANGE_ROUTE': 'handleNavigate'
    },

    initialize: function () {
        this.currentRoute = this.navigatingRoute = null; 
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

    /**
     * Public API
     * @Author: George_Chen
     * @Description: to set current navigating route
     *
     * @param {Object}        route, react-router route object
     */
    setNavigatingRoute: function(route) {
        this.navigatingRoute = route;
    },

    /**
     * Public API
     * @Author: George_Chen
     * @Description: to check candidate route is navigating or not
     *
     * @param {Object}        route, react-router route object
     */
    isRepeatNavigated: function(route) {
        if (this.navigatingRoute === null) {
            return false;
        }
        return (this.navigatingRoute.path === route.path);
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