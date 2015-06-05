'use strict';
var SharedUtils = require('../../../../sharedUtils/utils');

/**
 * @Public API
 * @Author: George_Chen
 * @Description: receive an onConference call notification on current channel
 * 
 * @param {Object}      actionContext, the fluxible's action context
 * @param {String}      data.channelId, the channel id
 */
module.exports = function(actionContext, data) {
    return SharedUtils.argsCheckAsync(data.channelId, 'md5')
        .then(function(cid) {
            actionContext.dispatch('ON_CONFERENCE', {
                channelId: cid,
                onConferenceCall: true
            });
        }).catch(function(err) {
            SharedUtils.printError('onConference.js', 'core', err);
        });
};
