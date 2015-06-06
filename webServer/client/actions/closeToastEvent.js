'use strict';
var SharedUtils = require('../../../sharedUtils/utils');

/**
 * Public API
 * @Author: George_Chen
 * @Description: handler on receive toast event
 * 
 * @param {String}      data.eventId, the event id
 */
module.exports = function(actionContext, data) {
    return SharedUtils.argsCheckAsync(data.eventId, 'string')
        .then(function(eid) {
            actionContext.dispatch('CLOSE_TOAST_EVENT', {
                eventId: eid
            });
        }).catch(function(err) {
            SharedUtils.printError('closeToastEvent.js', 'core', err);
        });
};
