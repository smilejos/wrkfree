'use strict';
var SharedUtils = require('../../../sharedUtils/utils');
var ActionUtils = require('./actionUtils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: used to setup the header unread discussions
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {Number}      data.counts, unread discussion counts
 */
module.exports = function(actionContext, data) {
    return SharedUtils.argsCheckAsync(data.counts, 'number')
        .then(function(counts) {
            if (counts < 0) {
                throw new Error('not correct message counts');
            }
            actionContext.dispatch('UPDATE_HEADER_DISCUSSIONS', {
                counts: counts
            });
        }).catch(function(err) {
            SharedUtils.printError('setUnreadDiscussions.js', 'core', err);
            ActionUtils.showErrorEvent('Header', 'set unread discussion msgs fail');
        });
};
