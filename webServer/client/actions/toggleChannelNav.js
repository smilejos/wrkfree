'use strict';
var SubscriptionStore = require('../../shared/stores/SubscriptionStore');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: toggle the channel navigation bar, more detail,
 * NOTE: if "mode.open" is missing, channel nav bar will be toggle to another mode.
 *       channelNav=on will be toggle to "off"
 *       channelNav=off will be toggle to "on"
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Object}      mode.open, indicate toggle channel nav bar to open or not
 * @param {Function}    callback, callback function
 */
module.exports = function(actionContext, mode, callback) {
    var navStore = actionContext.getStore(SubscriptionStore);
    // let navStore to detect his toggle mechanism
    return navStore.toggleAsync(mode.open).nodeify(callback);
};
