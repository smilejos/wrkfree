'use strict';
var SharedUtils = require('../../../sharedUtils/utils');
var ActionUtils = require('./actionUtils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: used to setup the header unread conversations
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Number}      data.counts, unread conversation counts
 */
module.exports = function(actionContext, data) {
    return SharedUtils.argsCheckAsync(data.counts, 'number')
        .then(function(msgCounts) {
            if (msgCounts < 0) {
                throw new Error('not correct message counts');
            }
            actionContext.dispatch('UPDATE_HEADER_CONVERSATIONS', {
                counts: msgCounts
            });
        }).catch(function(err) {
            SharedUtils.printError('setUnreadConverations.js', 'core', err);
            ActionUtils.showErrorEvent('Header', 'set unread conversations fail');
        });
};
