'use strict';
var SharedUtils = require('../../../sharedUtils/utils');
var HeaderStore = require('../../shared/stores/HeaderStore');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: used for handling singup success and preprocessing some basic info
 *
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Function}    data.transitionHandler, the mixin handler from signup component
 * @param {Object}      data.user, the valid self user info
 * @param {String}      data.nextRoute, the nextRoute of user who complete signup
 * @param {Function}    callback, callback function
 */
module.exports = function(actionContext, data, callback) {
    var headerStore = actionContext.getStore(HeaderStore);
    var state = {
        user: data.user,
        hasUnreadMsgs: false,
        hasNotification: false
    };
    return headerStore.polyfillAsync(state)
        .then(function() {
            return data.transitionHandler(data.nextRoute);
        }).catch(function(err) {
            SharedUtils.printError('completeSignup.js', 'core', err);
            //TODO: redirect to error page ?
        }).nodeify(callback);
};
